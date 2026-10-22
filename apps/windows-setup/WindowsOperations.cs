using Microsoft.Win32;
using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

namespace NuvoKit.Setup
{
    public sealed class WindowsOperations : ISetupOperations
    {
        private const string RuntimeKey = @"SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}";
        private const string BootstrapperUrl = "https://go.microsoft.com/fwlink/p/?LinkId=2124703";
        public const long MinimumFreeBytes = 512L * 1024 * 1024;
        private const long MaxBootstrapperBytes = 16L * 1024 * 1024;

        [StructLayout(LayoutKind.Sequential)]
        private struct SystemInfo
        {
            public ushort Architecture, Reserved;
            public uint PageSize;
            public IntPtr MinimumAddress, MaximumAddress, ActiveProcessorMask;
            public uint Processors, ProcessorType, AllocationGranularity;
            public ushort Level, Revision;
        }
        [DllImport("kernel32.dll")] private static extern void GetNativeSystemInfo(out SystemInfo info);

        public static bool IsSupported(int build, string installationType, ushort architecture)
        { return build >= 22000 && installationType == "Client" && architecture == 9; }

        public static string ReadRuntimeVersion()
        {
            foreach (RegistryHive hive in new[] { RegistryHive.LocalMachine, RegistryHive.CurrentUser })
                foreach (RegistryView view in new[] { RegistryView.Registry64, RegistryView.Registry32 })
                    using (RegistryKey root = RegistryKey.OpenBaseKey(hive, view))
                    using (RegistryKey key = root.OpenSubKey(RuntimeKey))
                    {
                        string version = key == null ? null : key.GetValue("pv") as string;
                        Version parsed;
                        if (Version.TryParse(version, out parsed) && parsed > new Version(0, 0)) return version;
                    }
            return null;
        }

        public static string DefaultDirectory()
        {
            foreach (RegistryView view in new[] { RegistryView.Registry64, RegistryView.Registry32 })
                using (RegistryKey root = RegistryKey.OpenBaseKey(RegistryHive.CurrentUser, view))
                using (RegistryKey key = root.OpenSubKey(@"Software\nuvokit\NuvoKit"))
                {
                    string path = key == null ? null : key.GetValue("") as string;
                    if (!String.IsNullOrWhiteSpace(path))
                        try { return NormalizeDirectory(path); } catch (SetupFailure) { }
                }
            return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "NuvoKit");
        }

        public static string NormalizeDirectory(string input)
        {
            try
            {
                if (String.IsNullOrWhiteSpace(input) || !Regex.IsMatch(input, @"^[a-zA-Z]:[\\/]"))
                    throw new SetupFailure("Chọn thư mục trên một ổ đĩa local, ví dụ E:\\Apps\\NuvoKit.");
                if (input.IndexOf('"') >= 0 || input.Substring(2).IndexOf(':') >= 0 || input.IndexOfAny(new[] { '\r', '\n', '\t' }) >= 0)
                    throw new SetupFailure("Đường dẫn chứa ký tự không hợp lệ.");
                foreach (string part in input.Substring(3).Replace('/', '\\').Split('\\'))
                    if (part.EndsWith(".") || part.EndsWith(" "))
                        throw new SetupFailure("Tên thư mục không được kết thúc bằng dấu chấm hoặc khoảng trắng.");
                string path = Path.GetFullPath(input.Replace('/', '\\')).TrimEnd('\\');
                if (path.Length > 180 || path.Length <= 3)
                    throw new SetupFailure("Chọn một thư mục con có đường dẫn ngắn hơn 180 ký tự.");
                foreach (string part in path.Substring(3).Split('\\'))
                    if (part.EndsWith(".") || part.EndsWith(" ") || part.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0)
                        throw new SetupFailure("Tên thư mục chứa ký tự không hợp lệ.");
                foreach (Environment.SpecialFolder special in new[] { Environment.SpecialFolder.Windows, Environment.SpecialFolder.System, Environment.SpecialFolder.ProgramFiles, Environment.SpecialFolder.ProgramFilesX86, Environment.SpecialFolder.UserProfile, Environment.SpecialFolder.DesktopDirectory, Environment.SpecialFolder.MyDocuments })
                {
                    string reserved = Environment.GetFolderPath(special).TrimEnd('\\');
                    if (String.Equals(path, reserved, StringComparison.OrdinalIgnoreCase))
                        throw new SetupFailure("Hãy chọn thư mục riêng cho NuvoKit, không chọn thư mục hệ thống hoặc thư mục tài liệu gốc.");
                    if ((special == Environment.SpecialFolder.Windows || special == Environment.SpecialFolder.System) && path.StartsWith(reserved + "\\", StringComparison.OrdinalIgnoreCase))
                        throw new SetupFailure("Không cài NuvoKit bên trong thư mục hệ thống.");
                }
                return path;
            }
            catch (SetupFailure) { throw; }
            catch (ArgumentException) { throw new SetupFailure("Đường dẫn cài đặt không hợp lệ."); }
            catch (NotSupportedException) { throw new SetupFailure("Đường dẫn cài đặt không hợp lệ."); }
            catch (PathTooLongException) { throw new SetupFailure("Đường dẫn cài đặt không hợp lệ."); }
        }

        public CheckResult Check(string directory)
        {
            SystemInfo info;
            GetNativeSystemInfo(out info);
            using (RegistryKey key = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows NT\CurrentVersion"))
            {
                int build;
                string value = key == null ? null : key.GetValue("CurrentBuildNumber") as string;
                int.TryParse(value, out build);
                if (!IsSupported(build, key == null ? null : key.GetValue("InstallationType") as string, info.Architecture))
                    throw new SetupFailure("Bản này dành cho Windows 11 x64. Máy hiện tại chưa thuộc cấu hình được hỗ trợ.");
            }
            string target = NormalizeDirectory(directory);
            var drive = new DriveInfo(Path.GetPathRoot(target));
            if (drive.DriveType != DriveType.Fixed || drive.AvailableFreeSpace < MinimumFreeBytes)
                throw new SetupFailure("Chọn ổ đĩa local còn ít nhất 512 MiB trống cho quá trình cài đặt.");
            string existing = target;
            while (!Directory.Exists(existing))
            {
                if (File.Exists(existing)) throw new SetupFailure("Đường dẫn đã có một file cùng tên. Hãy chọn thư mục khác.");
                existing = Path.GetDirectoryName(existing);
            }
            string probe = Path.Combine(existing, ".nuvokit-write-" + Guid.NewGuid().ToString("N"));
            try { using (new FileStream(probe, FileMode.CreateNew, FileAccess.Write, FileShare.None)) { } }
            catch (UnauthorizedAccessException) { throw new SetupFailure("Không ghi được thư mục đã chọn. Hãy chọn thư mục thuộc tài khoản của bạn."); }
            finally { if (File.Exists(probe)) File.Delete(probe); }
            foreach (Process process in Process.GetProcessesByName("nuvokit"))
                using (process)
                    try
                    {
                        if (String.Equals(process.MainModule.FileName, Path.Combine(target, "nuvokit.exe"), StringComparison.OrdinalIgnoreCase))
                            throw new SetupFailure("NuvoKit đang chạy trong thư mục này. Đóng ứng dụng rồi nhấn Thử lại.");
                    }
                    catch (System.ComponentModel.Win32Exception) { }
                    catch (InvalidOperationException) { }
            return new CheckResult { RuntimeVersion = ReadRuntimeVersion(), AvailableBytes = drive.AvailableFreeSpace };
        }

        public static string Hash(Stream stream)
        {
            using (SHA256 sha = SHA256.Create())
                return BitConverter.ToString(sha.ComputeHash(stream)).Replace("-", "").ToLowerInvariant();
        }

        public static bool EmbeddedPayloadValid()
        {
            using (Stream data = Assembly.GetExecutingAssembly().GetManifestResourceStream("NuvoKit.Payload"))
                return data != null && Hash(data) == BuildInfo.PayloadHash;
        }

        private static async Task Extract(string target, CancellationToken cancellation)
        {
            using (Stream input = Assembly.GetExecutingAssembly().GetManifestResourceStream("NuvoKit.Payload"))
            using (var output = new FileStream(target, FileMode.CreateNew, FileAccess.Write, FileShare.None))
            {
                if (input == null) throw new SetupFailure("Bộ cài thiếu thành phần. Hãy tải lại file Setup từ dự án.");
                await input.CopyToAsync(output, 81920, cancellation);
            }
            using (var data = File.OpenRead(target))
                if (Hash(data) != BuildInfo.PayloadHash) throw new SetupFailure("Bộ cài không khớp SHA-256. Hãy tải lại từ dự án.");
        }

        private static async Task<int> RunInstaller(string executable, string arguments)
        {
            return await Task.Run(() =>
            {
                using (Process process = Process.Start(new ProcessStartInfo(executable, arguments) { UseShellExecute = false, CreateNoWindow = true, WorkingDirectory = Path.GetDirectoryName(executable) }))
                {
                    process.WaitForExit();
                    return process.ExitCode;
                }
            });
        }

        public static bool AllowedMicrosoftUri(Uri uri)
        {
            return uri.Scheme == "https" && uri.IsDefaultPort && String.IsNullOrEmpty(uri.UserInfo)
                && (uri.Host.Equals("microsoft.com", StringComparison.OrdinalIgnoreCase) || uri.Host.EndsWith(".microsoft.com", StringComparison.OrdinalIgnoreCase)
                    || uri.Host.EndsWith(".msedge.net", StringComparison.OrdinalIgnoreCase));
        }

        private static async Task Download(string target, IProgress<Update> progress, CancellationToken cancellation)
        {
            using (var handler = new HttpClientHandler { AllowAutoRedirect = false })
            using (var client = new HttpClient(handler) { Timeout = TimeSpan.FromMinutes(3) })
            {
                Uri uri = new Uri(BootstrapperUrl);
                for (int redirect = 0; redirect < 6; redirect++)
                {
                    if (!AllowedMicrosoftUri(uri)) throw new SetupFailure("Nguồn tải không thuộc danh mục Microsoft được phép.");
                    using (HttpResponseMessage response = await client.GetAsync(uri, HttpCompletionOption.ResponseHeadersRead, cancellation))
                    {
                        int status = (int)response.StatusCode;
                        if (status >= 300 && status < 400 && response.Headers.Location != null)
                        { uri = new Uri(uri, response.Headers.Location); continue; }
                        response.EnsureSuccessStatusCode();
                        long? total = response.Content.Headers.ContentLength;
                        if (total > MaxBootstrapperBytes) throw new SetupFailure("File nguồn vượt giới hạn của trình chuẩn bị WebView2.");
                        using (Stream input = await response.Content.ReadAsStreamAsync())
                        using (var output = new FileStream(target, FileMode.CreateNew, FileAccess.Write, FileShare.None))
                        using (var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellation))
                        {
                            timeout.CancelAfter(TimeSpan.FromMinutes(3));
                            byte[] buffer = new byte[65536];
                            long count = 0;
                            int read;
                            while ((read = await input.ReadAsync(buffer, 0, buffer.Length, timeout.Token)) != 0)
                            {
                                count += read;
                                if (count > MaxBootstrapperBytes) throw new SetupFailure("File tải về vượt dung lượng cho phép.");
                                await output.WriteAsync(buffer, 0, read, timeout.Token);
                                int? percent = total > 0 ? (int?)Math.Min(100, count * 100 / total.Value) : null;
                                string bytes = (count / 1024).ToString("N0") + " KiB" + (total > 0 ? " / " + (total.Value / 1024).ToString("N0") + " KiB" : "");
                                progress.Report(new Update(InstallStage.Runtime, "Đang tải trình chuẩn bị WebView2…", "Nguồn: Microsoft · " + bytes, true, percent));
                            }
                            if (count == 0 || (total.HasValue && count != total.Value)) throw new SetupFailure("File tải chưa đầy đủ. Kiểm tra mạng rồi thử lại.");
                        }
                        return;
                    }
                }
                throw new SetupFailure("Nguồn tải chuyển hướng quá nhiều lần. Vui lòng thử lại sau.");
            }
        }

        public async Task EnsureRuntime(IProgress<Update> progress, CancellationToken cancellation)
        {
            string version = ReadRuntimeVersion();
            if (version != null)
            {
                progress.Report(new Update(InstallStage.Runtime, "WebView2 đã có sẵn", "Phiên bản " + version + " · bỏ qua tải và cài.", true, 100));
                return;
            }
            string temporary = NewTemporaryDirectory();
            try
            {
                string bootstrapper = Path.Combine(temporary, "MicrosoftEdgeWebview2Setup.exe");
                progress.Report(new Update(InstallStage.Runtime, "Đang kết nối tới Microsoft…", "Chuẩn bị thành phần hiển thị giao diện NuvoKit.", true));
                await Download(bootstrapper, progress, cancellation);
                cancellation.ThrowIfCancellationRequested();
                progress.Report(new Update(InstallStage.Runtime, "Đang xác minh chữ ký Microsoft…", "Kiểm tra nguồn và tính toàn vẹn trước khi chạy.", true));
                await Task.Run(() => VerifyMicrosoftSignature(bootstrapper), cancellation);
                cancellation.ThrowIfCancellationRequested();
                progress.Report(new Update(InstallStage.Runtime, "Đang cài Microsoft WebView2…", "Microsoft đang tải và chuẩn bị runtime. Vui lòng chờ.", false));
                int code = await RunInstaller(bootstrapper, "/silent /install");
                if (code == 3010 || code == 1641)
                    throw new SetupFailure("WebView2 yêu cầu khởi động lại Windows. Hãy khởi động lại rồi mở bộ cài NuvoKit lần nữa.", true);
                if (code != 0 || ReadRuntimeVersion() == null)
                    throw new SetupFailure("Chưa cài được WebView2 (mã " + code + "). Kiểm tra mạng và quyền cài, sau đó thử lại.");
            }
            finally { DeleteTemporaryDirectory(temporary); }
        }

        public async Task InstallApplication(string directory, IProgress<Update> progress, CancellationToken cancellation)
        {
            string target = NormalizeDirectory(directory);
            string temporary = NewTemporaryDirectory();
            try
            {
                progress.Report(new Update(InstallStage.Application, "Đang xác minh bộ cài NuvoKit…", "Kiểm tra SHA-256 của thành phần đã đóng gói.", true));
                string payload = Path.Combine(temporary, "nuvokit-payload.exe");
                await Extract(payload, cancellation);
                cancellation.ThrowIfCancellationRequested();
                Check(target);
                progress.Report(new Update(InstallStage.Application, "Đang cài NuvoKit…", "Đang ghi ứng dụng và tạo shortcut cho tài khoản hiện tại.", false));
                int code = await RunInstaller(payload, "/S /D=" + target);
                if (code != 0) throw new SetupFailure("Chưa cài xong NuvoKit (mã " + code + "). Đóng app đang chạy, kiểm tra quyền thư mục và thử lại.");
                string app = Path.Combine(target, "nuvokit.exe");
                if (!File.Exists(app)) throw new SetupFailure("Bộ cài chưa tạo được ứng dụng ở thư mục đã chọn.");
                using (var data = File.OpenRead(app))
                    if (Hash(data) != BuildInfo.ApplicationHash) throw new SetupFailure("Ứng dụng sau cài chưa khớp SHA-256. Vui lòng thử lại.");
            }
            finally { DeleteTemporaryDirectory(temporary); }
        }

        private static string NewTemporaryDirectory()
        {
            string path = Path.Combine(Path.GetTempPath(), "nuvokit-setup-" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(path);
            return path;
        }

        private static void DeleteTemporaryDirectory(string path)
        {
            string resolved = Path.GetFullPath(path);
            string parent = Path.GetFullPath(Path.GetTempPath()).TrimEnd('\\') + "\\";
            if (!resolved.StartsWith(parent, StringComparison.OrdinalIgnoreCase) || !Path.GetFileName(resolved).StartsWith("nuvokit-setup-", StringComparison.Ordinal)) return;
            try { Directory.Delete(resolved, true); } catch (IOException) { } catch (UnauthorizedAccessException) { }
        }

        public void Launch(string directory)
        {
            string app = Path.Combine(NormalizeDirectory(directory), "nuvokit.exe");
            using (var data = File.OpenRead(app))
                if (Hash(data) != BuildInfo.ApplicationHash) throw new SetupFailure("Ứng dụng đã thay đổi sau cài. Hãy chạy lại bộ cài trước khi mở.");
            Process.Start(new ProcessStartInfo(app) { UseShellExecute = true, WorkingDirectory = Path.GetDirectoryName(app) });
        }

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
        private struct TrustFile { public uint Size; [MarshalAs(UnmanagedType.LPWStr)] public string Path; public IntPtr File, Subject; }
        [StructLayout(LayoutKind.Sequential)]
        private struct TrustData
        {
            public uint Size; public IntPtr Policy, Sip; public uint UI, Revocation, Choice;
            public IntPtr File; public uint StateAction; public IntPtr State, Url;
            public uint Flags, Context;
        }
        [DllImport("wintrust.dll", ExactSpelling = true, PreserveSig = true)]
        private static extern int WinVerifyTrust(IntPtr window, ref Guid action, ref TrustData data);

        public static void VerifyMicrosoftSignature(string path)
        {
            var file = new TrustFile { Size = (uint)Marshal.SizeOf(typeof(TrustFile)), Path = path };
            IntPtr pointer = Marshal.AllocCoTaskMem(Marshal.SizeOf(typeof(TrustFile)));
            Marshal.StructureToPtr(file, pointer, false);
            var data = new TrustData { Size = (uint)Marshal.SizeOf(typeof(TrustData)), UI = 2, Choice = 1, File = pointer, StateAction = 1, Flags = 0x80 };
            Guid action = new Guid("00AAC56B-CD44-11D0-8CC2-00C04FC295EE");
            try
            {
                if (WinVerifyTrust(new IntPtr(-1), ref action, ref data) != 0)
                    throw new SetupFailure("Không xác minh được chữ ký tin cậy của WebView2. Kiểm tra mạng và thử lại.");
                using (var certificate = new X509Certificate2(X509Certificate.CreateFromSignedFile(path)))
                    if (certificate.GetNameInfo(X509NameType.SimpleName, false) != "Microsoft Corporation")
                        throw new SetupFailure("File runtime không được ký bởi Microsoft. Đã dừng cài.");
            }
            finally
            {
                data.StateAction = 2;
                WinVerifyTrust(new IntPtr(-1), ref action, ref data);
                Marshal.DestroyStructure(pointer, typeof(TrustFile));
                Marshal.FreeCoTaskMem(pointer);
            }
        }
    }
}
