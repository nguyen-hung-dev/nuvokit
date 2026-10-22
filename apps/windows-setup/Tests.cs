#if SETUP_TESTS
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace NuvoKit.Setup.Tests
{
    internal sealed class Immediate : IProgress<Update>
    {
        public readonly List<Update> Updates = new List<Update>();
        public void Report(Update value) { lock (Updates) Updates.Add(value); }
    }

    internal sealed class FakeOperations : ISetupOperations
    {
        public bool FailRuntime, FailApplication, FailCheck, Timeout;
        public int ApplicationCalls;
        public TaskCompletionSource<bool> Hold;
        public CheckResult Check(string path)
        {
            if (FailCheck) throw new SetupFailure("Máy chưa đáp ứng yêu cầu.");
            return new CheckResult { AvailableBytes = 20L * 1024 * 1024 * 1024 };
        }
        public async Task EnsureRuntime(IProgress<Update> progress, CancellationToken cancellation)
        {
            progress.Report(new Update(InstallStage.Runtime, "Đang cài Microsoft WebView2…", "Nguồn: Microsoft · kiểm thử bằng backend giả lập", false));
            if (Hold != null) await Hold.Task;
            if (Timeout) throw new TaskCanceledException();
            if (FailRuntime) throw new SetupFailure("Không tải được WebView2. Kiểm tra Internet rồi thử lại.");
            cancellation.ThrowIfCancellationRequested();
        }
        public Task InstallApplication(string directory, IProgress<Update> progress, CancellationToken cancellation)
        {
            ApplicationCalls++;
            progress.Report(new Update(InstallStage.Application, "Đang cài NuvoKit…", "Kiểm thử bằng backend giả lập", false));
            if (FailApplication) throw new SetupFailure("Ứng dụng sau cài chưa khớp SHA-256.");
            return Task.FromResult(true);
        }
        public void Launch(string directory) { }
    }

    internal static class Runner
    {
        private static int assertions;
        private static void Assert(bool value, string name)
        {
            if (!value) throw new Exception("FAILED: " + name);
            assertions++;
        }
        private static async Task Throws<T>(Func<Task> work, string name) where T : Exception
        {
            try { await work(); } catch (T) { assertions++; return; }
            throw new Exception("FAILED: expected " + typeof(T).Name + " — " + name);
        }
        [STAThread]
        public static int Main(string[] args)
        {
            try
            {
                if (args.Length >= 2 && args[0] == "--capture") { Capture(args[1], args[2]); return 0; }
                if (args.Length == 3 && args[0] == "--integration")
                {
                    if (Environment.GetEnvironmentVariable("NUVOKIT_SANDBOX_QA") != "1" || !Environment.UserName.Equals("WDAGUtilityAccount", StringComparison.OrdinalIgnoreCase))
                        throw new Exception("Integration install/uninstall is restricted to the disposable WDAG Sandbox profile with NUVOKIT_SANDBOX_QA=1.");
                    Integration(args[1], args[2]); return 0;
                }
                if (args.Length == 2 && args[0] == "--signature") { WindowsOperations.VerifyMicrosoftSignature(args[1]); Console.WriteLine("Microsoft signature verified"); return 0; }
                Tests().GetAwaiter().GetResult();
                UiTest();
                UiFailureTest(false);
                UiFailureTest(true);
                UiCompactTest();
                Console.WriteLine("{\"setupAssertionsPassed\":" + assertions + ",\"actualSystemInstallation\":false}");
                return 0;
            }
            catch (Exception error) { Console.Error.WriteLine(error); return 1; }
        }

        private static async Task Tests()
        {
            Assert(WindowsOperations.IsSupported(22000, "Client", 9), "Windows 11 x64");
            Assert(!WindowsOperations.IsSupported(19045, "Client", 9), "Windows 10 blocked");
            Assert(!WindowsOperations.IsSupported(26100, "Server", 9), "Server blocked");
            Assert(!WindowsOperations.IsSupported(26100, "Client", 12), "ARM64 blocked");
            foreach (string invalid in new[] { "", "relative", @"C:\", @"\\server\share\NuvoKit", "E:\\Apps\\\"NuvoKit", "E:\\Apps\\bad.", "E:\\Apps\\bad " })
            {
                bool rejected = false;
                try { WindowsOperations.NormalizeDirectory(invalid); } catch (SetupFailure) { rejected = true; }
                Assert(rejected, "unsafe destination rejected: " + invalid);
            }
            Assert(WindowsOperations.NormalizeDirectory(@"E:\Apps\Nuvo Kit") == @"E:\Apps\Nuvo Kit", "paths with spaces");
            string uninstall = "\"E:\\Apps\\Nuvo Kit\\uninstall.exe\"";
            Assert(WindowsOperations.MatchesUninstallRegistration(@"E:\Apps\Nuvo Kit", uninstall, uninstall + " /S", BuildInfo.Version), "interactive and quiet uninstall registration");
            Assert(!WindowsOperations.MatchesUninstallRegistration(@"E:\Apps\Nuvo Kit", uninstall + " /S", uninstall + " /S", BuildInfo.Version), "Windows uninstall must open GUI");
            Assert(!WindowsOperations.MatchesUninstallRegistration(@"E:\Apps\Other", uninstall, uninstall + " /S", BuildInfo.Version), "registration must match installation folder");
            Assert(!WindowsOperations.MatchesUninstallRegistration(@"E:\Apps\Nuvo Kit", uninstall, null, BuildInfo.Version), "quiet registration required");
            Assert(!WindowsOperations.MatchesUninstallRegistration(@"E:\Apps\Nuvo Kit", uninstall, uninstall + " /S", "0.0.0"), "registration version must match build");
            Assert(WindowsOperations.AllowedMicrosoftUri(new Uri("https://go.microsoft.com/fwlink/p/?LinkId=2124703")), "Microsoft HTTPS allowed");
            foreach (string invalid in new[] { "http://go.microsoft.com/", "https://microsoft.com.evil.test/", "https://example.com/", "https://user@go.microsoft.com/", "https://go.microsoft.com:8443/" })
                Assert(!WindowsOperations.AllowedMicrosoftUri(new Uri(invalid)), "redirect boundary");
            using (var data = new MemoryStream(System.Text.Encoding.ASCII.GetBytes("abc")))
                Assert(WindowsOperations.Hash(data) == "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", "SHA-256 known vector");
            Assert(WindowsOperations.EmbeddedPayloadValid(), "embedded fixture integrity");
            string unsigned = Path.GetTempFileName();
            try
            {
                File.WriteAllText(unsigned, "unsigned test fixture, never executed");
                bool rejected = false;
                try { WindowsOperations.VerifyMicrosoftSignature(unsigned); } catch (SetupFailure) { rejected = true; }
                Assert(rejected, "unsigned runtime cannot execute");
            }
            finally { File.Delete(unsigned); }

            var success = new FakeOperations();
            var progress = new Immediate();
            await new SetupController(success).Run(@"E:\Apps\NuvoKit", progress, CancellationToken.None);
            Assert(success.ApplicationCalls == 1 && progress.Updates.Last().Stage == InstallStage.Complete, "completion after application verification");
            foreach (FakeOperations failed in new[] { new FakeOperations { FailCheck = true }, new FakeOperations { FailRuntime = true }, new FakeOperations { FailApplication = true } })
            {
                var events = new Immediate();
                await Throws<SetupFailure>(() => new SetupController(failed).Run(@"E:\Apps\NuvoKit", events, CancellationToken.None), "failure propagates");
                Assert(!events.Updates.Any(x => x.Stage == InstallStage.Complete), "failure never reports success");
                if (failed.FailRuntime) Assert(failed.ApplicationCalls == 0, "runtime failure blocks payload");
            }
            using (var token = new CancellationTokenSource())
            {
                token.Cancel();
                var canceled = new FakeOperations();
                await Throws<OperationCanceledException>(() => new SetupController(canceled).Run(@"E:\Apps\NuvoKit", new Immediate(), token.Token), "cancel before install");
                Assert(canceled.ApplicationCalls == 0, "cancel does not execute payload");
            }
            var held = new FakeOperations { Hold = new TaskCompletionSource<bool>() };
            var controller = new SetupController(held);
            Task first = controller.Run(@"E:\Apps\NuvoKit", new Immediate(), CancellationToken.None);
            await Throws<SetupFailure>(() => controller.Run(@"E:\Apps\NuvoKit", new Immediate(), CancellationToken.None), "single operation guard");
            held.Hold.SetResult(true);
            await first;
            await controller.Run(@"E:\Apps\NuvoKit", new Immediate(), CancellationToken.None);
            Assert(held.ApplicationCalls == 2, "guard releases after operation");
        }

        private static Control Find(Control root, string name)
        { return root.Controls.Find(name, true).Single(); }

        private static void Integration(string target, string resultFile)
        {
            // Compiled only into the QA helper. Run in Windows Sandbox, never on
            // a personal profile: this installs, reinstalls and uninstalls.
            bool initial = WindowsOperations.ReadRuntimeVersion() != null;
            try
            {
                var operations = new WindowsOperations();
                var controller = new SetupController(operations);
                string data = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "com.nuvokit.desktop");
                Directory.CreateDirectory(data);
                string marker = Path.Combine(data, "qa-preserve-marker.txt");
                File.WriteAllText(marker, "synthetic preservation marker");
                controller.Run(target, new Immediate(), CancellationToken.None).GetAwaiter().GetResult();
                controller.Run(target, new Immediate(), CancellationToken.None).GetAwaiter().GetResult();
                Assert(File.ReadAllText(marker) == "synthetic preservation marker", "reinstall preserves data");
                var smoke = new System.Diagnostics.ProcessStartInfo(Path.Combine(target, "nuvokit.exe"), "--smoke-test") { UseShellExecute = false, RedirectStandardOutput = true, RedirectStandardError = true, CreateNoWindow = true };
                using (var process = System.Diagnostics.Process.Start(smoke))
                {
                    string output = process.StandardOutput.ReadToEnd();
                    process.WaitForExit();
                    Assert(process.ExitCode == 0 && output.Contains("\"webviewReady\":true"), "installed native core smoke");
                }
                using (var process = System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(Path.Combine(target, "uninstall.exe"), "/S _?=" + target) { UseShellExecute = false, CreateNoWindow = true }))
                { process.WaitForExit(); Assert(process.ExitCode == 0, "uninstall exit"); }
                Assert(!File.Exists(Path.Combine(target, "nuvokit.exe")), "uninstall removes program");
                Assert(File.Exists(marker), "uninstall preserves user data by default");
                File.WriteAllText(resultFile, "{\"success\":true,\"runtimeInitiallyPresent\":" + (initial ? "true" : "false") + ",\"reinstall\":true,\"installedCoreSmoke\":true,\"uninstall\":true,\"dataPreserved\":true}");
            }
            catch (Exception error)
            {
                string text = error.Message.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\r", "").Replace("\n", " ");
                File.WriteAllText(resultFile, "{\"success\":false,\"error\":\"" + text + "\"}");
                throw;
            }
        }

        private static void UiTest()
        {
            Application.EnableVisualStyles();
            var fake = new FakeOperations { Hold = new TaskCompletionSource<bool>() };
            using (var form = new SetupForm(fake, @"E:\Apps\NuvoKit"))
            using (var timer = new System.Windows.Forms.Timer { Interval = 30 })
            {
                int step = 0, ticks = 0;
                Exception failed = null;
                timer.Tick += delegate
                {
                    try
                    {
                        if (++ticks > 300) throw new Exception("UI test timeout");
                        var start = (Button)Find(form, "StartInstall");
                        var cancel = (Button)Find(form, "CancelInstall");
                        if (step == 0 && start.Enabled)
                        { start.PerformClick(); step = 1; }
                        else if (step == 1 && Find(form, "RuntimeStatus").Text.Contains("Đang cài Microsoft"))
                        {
                            Assert(!cancel.Enabled && !start.Visible, "unsafe cancellation disabled while runtime installs");
                            fake.Hold.SetResult(true); step = 2;
                        }
                        else if (step == 2 && start.Text == "Mở NuvoKit")
                        {
                            Assert(start.Enabled && cancel.Enabled && Find(form, "SetupHeading").Text == "Cài đặt hoàn tất", "success controls ready");
                            timer.Stop(); form.Close();
                        }
                    }
                    catch (Exception error) { failed = error; timer.Stop(); form.Dispose(); Application.ExitThread(); }
                };
                timer.Start(); Application.Run(form);
                if (failed != null) throw failed;
            }
        }

        private static void Capture(string scenario, string file)
        {
            Application.EnableVisualStyles();
            var fake = new FakeOperations { Hold = new TaskCompletionSource<bool>(), FailRuntime = scenario == "error", Timeout = scenario == "timeout" };
            if (scenario != "runtime" && scenario != "compact") fake.Hold.SetResult(true);
            using (var form = new SetupForm(fake, @"E:\Apps\NuvoKit"))
            using (var timer = new System.Windows.Forms.Timer { Interval = 250 })
            {
                if (scenario == "compact") form.Height = 660;
                int ticks = 0; bool started = false;
                timer.Tick += delegate
                {
                    var start = (Button)Find(form, "StartInstall");
                    if (!started && start.Enabled && scenario != "welcome") { start.PerformClick(); started = true; }
                    if (++ticks < 7) return;
                    using (var bitmap = new Bitmap(form.Width, form.Height))
                    { form.DrawToBitmap(bitmap, new Rectangle(Point.Empty, bitmap.Size)); bitmap.Save(file, ImageFormat.Png); }
                    timer.Stop(); form.Dispose(); Application.ExitThread();
                };
                timer.Start(); Application.Run(form);
            }
        }

        private static void UiFailureTest(bool timeout)
        {
            using (var form = new SetupForm(new FakeOperations { FailRuntime = !timeout, Timeout = timeout }, @"E:\Apps\NuvoKit"))
            using (var timer = new System.Windows.Forms.Timer { Interval = 25 })
            {
                bool started = false; int ticks = 0; Exception failed = null;
                timer.Tick += delegate
                {
                    try
                    {
                        if (++ticks > 300) throw new Exception("UI failure test timeout");
                        var start = (Button)Find(form, "StartInstall");
                        if (!started && start.Enabled) { start.PerformClick(); started = true; }
                        else if (started && Find(form, "SetupHeading").Text == "Chưa cài xong NuvoKit")
                        {
                            Assert(start.Enabled && start.Text == "Thử lại", "network failure offers retry");
                            Assert(Find(form, "InstallDirectory").Visible, "failed install allows changing destination");
                            Assert(((Button)Find(form, "CancelInstall")).Enabled, "failed install can close");
                            timer.Stop(); form.Close();
                        }
                    }
                    catch (Exception error) { failed = error; timer.Stop(); form.Dispose(); Application.ExitThread(); }
                };
                timer.Start(); Application.Run(form);
                if (failed != null) throw failed;
            }
        }

        private static void UiCompactTest()
        {
            var fake = new FakeOperations { Hold = new TaskCompletionSource<bool>() };
            using (var form = new SetupForm(fake, @"E:\Apps\NuvoKit"))
            using (var timer = new System.Windows.Forms.Timer { Interval = 25 })
            {
                form.Height = 660;
                int step = 0, ticks = 0; Exception failed = null;
                timer.Tick += delegate
                {
                    try
                    {
                        if (++ticks > 300) throw new Exception("Compact UI test timeout");
                        var start = (Button)Find(form, "StartInstall");
                        var cancel = (Button)Find(form, "CancelInstall");
                        if (step == 0 && start.Enabled) { start.PerformClick(); step = 1; }
                        else if (step == 1 && Find(form, "RuntimeStatus").Text.Contains("Đang cài Microsoft"))
                        {
                            Rectangle button = form.RectangleToClient(cancel.Parent.RectangleToScreen(cancel.Bounds));
                            Assert(form.ClientRectangle.Contains(button), "compact window keeps footer actions reachable");
                            Assert(((ScrollableControl)Find(form, "SetupContent")).VerticalScroll.Visible, "compact content scrolls instead of clipping");
                            fake.Hold.SetResult(true); step = 2;
                        }
                        else if (step == 2 && start.Text == "Mở NuvoKit") { timer.Stop(); form.Close(); }
                    }
                    catch (Exception error) { failed = error; timer.Stop(); form.Dispose(); Application.ExitThread(); }
                };
                timer.Start(); Application.Run(form);
                if (failed != null) throw failed;
            }
        }
    }
}
#endif
