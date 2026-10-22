using System;
using System.Drawing;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;

namespace NuvoKit.Setup
{
    internal static class Program
    {
        [DllImport("user32.dll")] private static extern bool SetProcessDpiAwarenessContext(IntPtr context);

        [STAThread]
        private static int Main(string[] args)
        {
            if (args.Length == 1 && args[0] == "--diagnostics")
            {
                bool valid = WindowsOperations.EmbeddedPayloadValid();
                Console.WriteLine("{\"version\":\"" + BuildInfo.Version + "\",\"embeddedPayloadValid\":" + (valid ? "true" : "false") + ",\"webviewPresent\":" + (WindowsOperations.ReadRuntimeVersion() != null ? "true" : "false") + "}");
                return valid ? 0 : 1;
            }
            if (args.Length != 0) return 2;
            System.Net.ServicePointManager.SecurityProtocol = System.Net.SecurityProtocolType.SystemDefault;
            SetProcessDpiAwarenessContext(new IntPtr(-4));
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            bool created;
            using (var mutex = new Mutex(true, @"Local\NuvoKit.Setup", out created))
            {
                if (!created) { MessageBox.Show("Bộ cài NuvoKit đang mở. Hãy quay lại cửa sổ đó.", "NuvoKit"); return 1; }
                try
                {
                    if (!WindowsOperations.EmbeddedPayloadValid())
                        throw new SetupFailure("Bộ cài không đầy đủ. Hãy tải lại từ trang phát hành NuvoKit.");
                    Application.Run(new SetupForm(new WindowsOperations(), WindowsOperations.DefaultDirectory()));
                    return 0;
                }
                catch (Exception error)
                { MessageBox.Show(error.Message, "Không mở được bộ cài NuvoKit", MessageBoxButtons.OK, MessageBoxIcon.Error); return 1; }
            }
        }
    }

    public sealed class SetupForm : Form
    {
        private static readonly Color Ink = Color.FromArgb(23, 32, 58);
        private static readonly Color Muted = Color.FromArgb(98, 111, 132);
        private static readonly Color Accent = Color.FromArgb(102, 87, 232);
        private static readonly Color Line = Color.FromArgb(228, 232, 241);
        private static readonly Color Green = Color.FromArgb(33, 132, 91);
        private readonly ISetupOperations operations;
        private readonly SetupController controller;
        private readonly Panel main = new Panel(), footer = new Panel();
        private readonly Panel systemPanel;
        private readonly Label heading, introduction, systemTitle, systemDetail, sectionTitle, sectionDetail;
        private readonly Label runtimeTitle, runtimeDetail, runtimeStatus, appTitle, appDetail, completeTitle, completeDetail, cancelHint;
        private readonly StepRow[] steps = new StepRow[4];
        private readonly ProgressBar progressBar;
        private readonly Panel location;
        private readonly TextBox directory;
        private readonly Button primary, cancel, details;
        private readonly ToolTip tooltip = new ToolTip();
        private CancellationTokenSource cancellation;
        private bool busy, cancelAllowed, completed, checking, ready;
        private InstallStage stage;
        private string installedDirectory;
        private readonly System.Text.StringBuilder history = new System.Text.StringBuilder();

        public SetupForm(ISetupOperations operations, string initialDirectory)
        {
            this.operations = operations;
            controller = new SetupController(operations);
            Text = "Cài đặt NuvoKit";
            Name = "NuvoKitSetup";
            AutoScaleMode = AutoScaleMode.Dpi;
            AutoScaleDimensions = new SizeF(96, 96);
            ClientSize = new Size(1100, 760);
            MinimumSize = new Size(980, 620);
            StartPosition = FormStartPosition.CenterScreen;
            BackColor = Color.White;
            Font = new Font("Segoe UI", 10.5f);
            using (Stream icon = Assembly.GetExecutingAssembly().GetManifestResourceStream("NuvoKit.Icon"))
                if (icon != null) using (var loaded = new Icon(icon)) Icon = (Icon)loaded.Clone();

            var rail = new Panel { Dock = DockStyle.Left, Width = 235, BackColor = Color.FromArgb(247, 248, 253), AutoScroll = true };
            Controls.Add(rail);
            var logo = new PictureBox { Location = new Point(25, 29), Size = new Size(32, 32), SizeMode = PictureBoxSizeMode.Zoom, TabStop = false };
            using (Stream mark = Assembly.GetExecutingAssembly().GetManifestResourceStream("NuvoKit.Mark"))
                if (mark != null) using (var loaded = new Bitmap(mark)) logo.Image = new Bitmap(loaded);
            rail.Controls.Add(logo);
            LabelOn(rail, "NuvoKit", 66, 25, 155, 40, 21, FontStyle.Bold, Ink);
            string[] titles = { "Kiểm tra máy", "Chuẩn bị môi trường", "Cài NuvoKit", "Hoàn tất" };
            for (int i = 0; i < 4; i++)
            {
                steps[i] = new StepRow(i + 1, titles[i]) { Location = new Point(12, 104 + i * 112), Size = new Size(215, 100) };
                rail.Controls.Add(steps[i]);
            }
            var railVersion = LabelOn(rail, "NuvoKit " + BuildInfo.Version + "\nWindows 11 · x64", 26, 635, 190, 55, 9, FontStyle.Regular, Muted);
            railVersion.Anchor = AnchorStyles.Bottom | AnchorStyles.Left;
            Resize += delegate { railVersion.Visible = ClientSize.Height >= 710; };

            main.Dock = DockStyle.Fill;
            main.BackColor = Color.White;
            Controls.Add(main);
            main.BringToFront();
            heading = LabelOn(main, "Chuẩn bị cài đặt", 38, 35, 780, 54, 29, FontStyle.Bold, Ink);
            heading.Name = "SetupHeading";
            introduction = LabelOn(main, "Cài NuvoKit và chuẩn bị các thành phần cần thiết cho máy của bạn.", 40, 94, 780, 48, 11.5f, FontStyle.Regular, Muted);
            var system = new Panel { Location = new Point(40, 156), Size = new Size(744, 83), BackColor = Color.FromArgb(239, 249, 243), Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right };
            systemPanel = system;
            main.Controls.Add(system);
            systemTitle = LabelOn(system, "Đang kiểm tra máy…", 22, 14, 690, 29, 14, FontStyle.Bold, Ink);
            systemDetail = LabelOn(system, "Windows, dung lượng và quyền ghi thư mục.", 22, 46, 690, 26, 10.5f, FontStyle.Regular, Muted);
            sectionTitle = LabelOn(main, "Nơi cài ứng dụng", 40, 264, 740, 32, 16, FontStyle.Bold, Ink);
            sectionDetail = LabelOn(main, "Cài cho tài khoản Windows hiện tại. Dữ liệu đang có được giữ lại.", 40, 300, 744, 40, 10.5f, FontStyle.Regular, Muted);
            location = new Panel { Location = new Point(40, 348), Size = new Size(744, 74), Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right };
            main.Controls.Add(location);
            directory = new TextBox { Name = "InstallDirectory", AccessibleName = "Thư mục cài NuvoKit", Text = initialDirectory, Location = new Point(0, 4), Size = new Size(622, 31), Anchor = AnchorStyles.Left | AnchorStyles.Top | AnchorStyles.Right };
            location.Controls.Add(directory);
            var browse = ButtonOn(location, "Chọn…", 636, 0, 108, 36, false);
            browse.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            browse.Click += delegate { using (var dialog = new FolderBrowserDialog { Description = "Chọn thư mục cài NuvoKit", SelectedPath = directory.Text, ShowNewFolderButton = true }) if (dialog.ShowDialog(this) == DialogResult.OK) { directory.Text = dialog.SelectedPath; } };
            LabelOn(location, "WebView2 còn thiếu sẽ được tải từ Microsoft; bước này cần Internet.", 0, 45, 740, 24, 9.5f, FontStyle.Regular, Muted);
            directory.TextChanged += async delegate { if (!busy) await CheckDirectory(); };

            runtimeTitle = LabelOn(main, "Microsoft WebView2", 64, 361, 350, 30, 16, FontStyle.Bold, Ink);
            runtimeDetail = LabelOn(main, "Thành phần hiển thị giao diện NuvoKit.\nNguồn: Microsoft", 64, 399, 365, 82, 10.5f, FontStyle.Regular, Muted);
            runtimeStatus = LabelOn(main, "Đang chờ", 452, 369, 308, 46, 11, FontStyle.Bold, Accent);
            runtimeStatus.Name = "RuntimeStatus";
            progressBar = new AccentProgressBar { Location = new Point(452, 426), Size = new Size(308, 12), Style = ProgressBarStyle.Marquee, MarqueeAnimationSpeed = 24, Anchor = AnchorStyles.Left | AnchorStyles.Right | AnchorStyles.Top };
            main.Controls.Add(progressBar);
            var runtimePanel = new Panel { Location = new Point(40, 340), Size = new Size(744, 154), BorderStyle = BorderStyle.FixedSingle, BackColor = Color.White, Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right };
            main.Controls.Add(runtimePanel);
            foreach (Control child in new Control[] { runtimeTitle, runtimeDetail, runtimeStatus, progressBar })
            { Point position = child.Location; runtimePanel.Controls.Add(child); child.Location = new Point(position.X - 40, position.Y - 340); }
            runtimePanel.Visible = false;
            runtimePanel.Name = "RuntimePanel";
            appTitle = LabelOn(main, "Cài NuvoKit", 64, 539, 680, 28, 12, FontStyle.Bold, Muted);
            appDetail = LabelOn(main, "Đang chờ chuẩn bị môi trường.", 64, 570, 680, 26, 10, FontStyle.Regular, Muted);
            completeTitle = LabelOn(main, "Hoàn tất", 64, 609, 680, 27, 12, FontStyle.Bold, Muted);
            completeDetail = LabelOn(main, "Đang chờ cài ứng dụng.", 64, 639, 680, 27, 10, FontStyle.Regular, Muted);

            footer.Dock = DockStyle.Bottom;
            footer.Height = 83;
            footer.BackColor = Color.FromArgb(252, 252, 255);
            main.Controls.Add(footer);
            footer.BringToFront();
            details = ButtonOn(footer, "Xem chi tiết", 30, 23, 130, 38, false);
            details.Click += delegate { ShowDetails(); };
            cancelHint = LabelOn(footer, "", 170, 31, 315, 30, 9.5f, FontStyle.Regular, Muted);
            primary = ButtonOn(footer, "Cài đặt NuvoKit", 492, 23, 170, 38, true);
            primary.Anchor = AnchorStyles.Right | AnchorStyles.Top;
            primary.Name = "StartInstall";
            primary.Click += async delegate { if (completed) Launch(); else if (!ready) await CheckDirectory(); else await BeginInstall(); };
            cancel = ButtonOn(footer, "Hủy", 675, 23, 100, 38, false);
            cancel.Anchor = AnchorStyles.Right | AnchorStyles.Top;
            cancel.Name = "CancelInstall";
            cancel.Click += delegate { if (busy) { if (cancelAllowed) { cancellation.Cancel(); cancel.Enabled = false; cancelHint.Text = "Đang dừng tải an toàn…"; } } else Close(); };
            AcceptButton = primary;
            CancelButton = cancel;
            FormClosing += delegate(object sender, FormClosingEventArgs e)
            {
                if (!busy) return;
                e.Cancel = true;
                if (cancelAllowed) { cancellation.Cancel(); cancel.Enabled = false; cancelHint.Text = "Đang dừng an toàn…"; }
                else cancelHint.Text = "Chưa thể hủy trong bước này.";
            };
            var body = new Panel { Name = "SetupContent", Dock = DockStyle.Fill, AutoScroll = true, BackColor = Color.White };
            main.Controls.Add(body);
            body.BringToFront();
            var moving = new Control[main.Controls.Count];
            main.Controls.CopyTo(moving, 0);
            foreach (Control child in moving)
                if (child != footer && child != body) { main.Controls.Remove(child); body.Controls.Add(child); }
            Shown += async delegate
            {
                Rectangle available = Screen.FromControl(this).WorkingArea;
                MinimumSize = new Size(Math.Min(MinimumSize.Width, available.Width - 16), Math.Min(MinimumSize.Height, available.Height - 16));
                Size = new Size(Math.Min(Width, available.Width - 16), Math.Min(Height, available.Height - 16));
                Location = new Point(available.X + (available.Width - Width) / 2, available.Y + (available.Height - Height) / 2);
                body.AutoScrollMinSize = new Size(0, completeDetail.Bottom + 8);
                SetBusyView(false);
                await CheckDirectory();
            };
            SetBusyView(false);
        }

        private static Label LabelOn(Control parent, string text, int x, int y, int width, int height, float size, FontStyle style, Color color)
        {
            var label = new Label { Text = text, Location = new Point(x, y), Size = new Size(width, height), Font = new Font("Segoe UI", size, style), ForeColor = color, BackColor = Color.Transparent, AutoEllipsis = true, UseMnemonic = false, Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right };
            parent.Controls.Add(label);
            return label;
        }

        private static Button ButtonOn(Control parent, string text, int x, int y, int width, int height, bool accent)
        {
            var button = new Button { Text = text, Location = new Point(x, y), Size = new Size(width, height), FlatStyle = FlatStyle.Flat, BackColor = accent ? Accent : Color.White, ForeColor = accent ? Color.White : Ink, Cursor = Cursors.Hand, UseVisualStyleBackColor = false };
            button.FlatAppearance.BorderColor = accent ? Accent : Line;
            parent.Controls.Add(button);
            return button;
        }

        private void SetBusyView(bool value)
        {
            location.Visible = !value;
            runtimeTitle.Visible = runtimeDetail.Visible = runtimeStatus.Visible = progressBar.Visible = appTitle.Visible = appDetail.Visible = completeTitle.Visible = completeDetail.Visible = value;
            main.Controls.Find("RuntimePanel", true)[0].Visible = value;
            primary.Visible = !value;
            cancelHint.Width = Math.Max(120, (value ? cancel.Left : primary.Left) - cancelHint.Left - 12);
        }

        private async System.Threading.Tasks.Task CheckDirectory()
        {
            if (checking) return;
            checking = true;
            primary.Enabled = false;
            string candidate = directory.Text;
            try
            {
                CheckResult check = await System.Threading.Tasks.Task.Run(() => operations.Check(candidate));
                systemTitle.Text = "Windows 11 · 64-bit";
                systemPanel.BackColor = Color.FromArgb(239, 249, 243);
                systemDetail.Text = "Đáp ứng yêu cầu · " + (check.AvailableBytes / (1024.0 * 1024 * 1024)).ToString("N1") + " GiB trống trên ổ cài.";
                sectionDetail.Text = check.RuntimeVersion == null ? "WebView2 sẽ được tải từ Microsoft nếu còn thiếu." : "WebView2 đã có sẵn. Bộ cài sẽ giữ dữ liệu NuvoKit đang có.";
                primary.Enabled = true;
                primary.Text = "Cài đặt NuvoKit";
                ready = true;
                steps[0].SetState(1, "Đã kiểm tra");
            }
            catch (Exception error)
            {
                systemTitle.Text = "Cần kiểm tra lại";
                systemPanel.BackColor = Color.FromArgb(255, 245, 229);
                systemDetail.Text = Friendly(error);
                sectionDetail.Text = Friendly(error);
                history.AppendLine("Kiểm tra máy: " + Friendly(error));
                tooltip.SetToolTip(systemDetail, systemDetail.Text);
                ready = false;
                primary.Text = "Kiểm tra lại";
                primary.Enabled = true;
                steps[0].SetState(-1, "Cần xử lý");
            }
            finally
            {
                checking = false;
            }
            if (candidate != directory.Text && !busy) await CheckDirectory();
        }

        private async System.Threading.Tasks.Task BeginInstall()
        {
            if (busy) return;
            busy = true; completed = false;
            cancellation = new CancellationTokenSource();
            string target = directory.Text;
            primary.Enabled = false;
            SetBusyView(true);
            heading.Text = "Chuẩn bị môi trường";
            sectionTitle.Text = "Đang cài đặt thành phần";
            sectionDetail.Text = "Các bước được kiểm tra trước khi chuyển sang phần tiếp theo.";
            try
            {
                await controller.Run(target, new UiProgress(this), cancellation.Token);
                completed = true;
                installedDirectory = WindowsOperations.NormalizeDirectory(target);
                heading.Text = "Cài đặt hoàn tất";
                introduction.Text = "NuvoKit đã sẵn sàng cho những việc quan trọng của bạn.";
                sectionTitle.Text = "Bạn có thể mở ứng dụng";
                sectionDetail.Text = "Các gói tùy chọn có thể cài thêm trong màn hình Thành phần.";
                primary.Text = "Mở NuvoKit";
                primary.Visible = primary.Enabled = true;
                cancel.Text = "Đóng";
                cancelHint.Text = "";
            }
            catch (OperationCanceledException error)
            {
                if (cancellation.IsCancellationRequested)
                {
                    heading.Text = "Đã dừng cài đặt";
                    sectionTitle.Text = "Bạn có thể thử lại khi sẵn sàng";
                    sectionDetail.Text = "File tạm đã được dọn. Thành phần hệ thống dùng chung được giữ lại.";
                    ResetForRetry();
                }
                else ShowFailure(error);
            }
            catch (Exception error)
            {
                ShowFailure(error);
            }
            finally
            {
                busy = false;
                cancelAllowed = true;
                cancel.Enabled = true;
                cancellation.Dispose();
                progressBar.Style = ProgressBarStyle.Blocks;
                if (!completed) progressBar.Value = 0;
            }
        }

        private void ResetForRetry()
        {
            SetBusyView(false);
            primary.Text = "Thử lại";
            primary.Enabled = primary.Visible = true;
            cancelHint.Text = "Xem chi tiết nếu bạn cần gửi thông báo lỗi.";
            runtimeDetail.Text = "Thành phần hiển thị giao diện NuvoKit.\nNguồn: Microsoft";
        }

        private void ShowFailure(Exception error)
        {
            heading.Text = "Chưa cài xong NuvoKit";
            sectionTitle.Text = "Cần xử lý trước khi tiếp tục";
            sectionDetail.Text = Friendly(error);
            tooltip.SetToolTip(sectionDetail, sectionDetail.Text);
            history.AppendLine("Lỗi: " + error.Message);
            steps[(int)stage].SetState(-1, "Cần xử lý");
            runtimeStatus.Text = "Chưa hoàn tất";
            ResetForRetry();
        }

        private sealed class UiProgress : IProgress<Update>
        {
            private readonly SetupForm owner;
            public UiProgress(SetupForm owner) { this.owner = owner; }
            public void Report(Update value)
            {
                if (owner.InvokeRequired) owner.Invoke(new Action(() => owner.OnUpdate(value)));
                else owner.OnUpdate(value);
            }
        }

        private void OnUpdate(Update update)
        {
            stage = update.Stage;
            cancelAllowed = update.CanCancel;
            cancel.Enabled = update.CanCancel;
            cancelHint.Text = update.CanCancel ? "Có thể hủy trước khi chạy trình cài đặt." : "Chưa thể hủy trong bước này.";
            for (int i = 0; i < steps.Length; i++) steps[i].SetState(i < (int)stage ? 1 : i == (int)stage ? 2 : 0, i < (int)stage ? "Đã xong" : i == (int)stage ? "Đang thực hiện" : "Đang chờ");
            if (stage == InstallStage.Complete) steps[3].SetState(1, "Đã xong");
            runtimeStatus.Text = update.Message;
            runtimeTitle.Text = stage == InstallStage.Check ? "Kiểm tra môi trường" : stage >= InstallStage.Application ? "NuvoKit " + BuildInfo.Version : "Microsoft WebView2";
            runtimeDetail.Text = stage == InstallStage.Runtime ? "Thành phần hiển thị giao diện NuvoKit.\n" + update.Detail : update.Detail;
            appTitle.ForeColor = stage >= InstallStage.Application ? Ink : Muted;
            appDetail.Text = stage == InstallStage.Application ? "Đang ghi ứng dụng và shortcut." : stage == InstallStage.Complete ? "Đã xác minh SHA-256 ứng dụng." : "Đang chờ chuẩn bị môi trường.";
            completeTitle.ForeColor = stage == InstallStage.Complete ? Green : Muted;
            completeDetail.Text = stage == InstallStage.Complete ? "Sẵn sàng mở NuvoKit." : "Đang chờ cài ứng dụng.";
            if (update.Percent.HasValue)
            {
                progressBar.Style = ProgressBarStyle.Blocks;
                progressBar.Value = Math.Max(0, Math.Min(100, update.Percent.Value));
            }
            else { progressBar.Style = ProgressBarStyle.Marquee; progressBar.MarqueeAnimationSpeed = 24; }
            history.AppendLine(update.Message + " — " + update.Detail);
        }

        private static string Friendly(Exception error)
        {
            if (error is SetupFailure) return error.Message;
            if (error is System.Net.Http.HttpRequestException || error is System.Threading.Tasks.TaskCanceledException)
                return "Không kết nối được tới Microsoft. Kiểm tra Internet rồi thử lại.";
            if (error is UnauthorizedAccessException) return "Chưa có quyền ghi thư mục. Chọn vị trí thuộc tài khoản của bạn.";
            if (error is IOException) return "Không ghi được file. Kiểm tra dung lượng, quyền thư mục và đóng ứng dụng đang chạy.";
            return "Bước cài đặt chưa hoàn tất. Xem chi tiết rồi thử lại.";
        }

        private void Launch()
        {
            try { operations.Launch(installedDirectory); Close(); }
            catch (Exception error) { MessageBox.Show(this, Friendly(error), "Chưa mở được NuvoKit", MessageBoxButtons.OK, MessageBoxIcon.Warning); }
        }

        private void ShowDetails()
        {
            using (var dialog = new Form { Text = "Chi tiết cài đặt NuvoKit", Size = new Size(740, 440), StartPosition = FormStartPosition.CenterParent, MinimizeBox = false, MaximizeBox = false, Font = Font })
            {
                var text = new TextBox { Multiline = true, ReadOnly = true, Dock = DockStyle.Fill, ScrollBars = ScrollBars.Vertical, Text = "NuvoKit " + BuildInfo.Version + Environment.NewLine + "Phạm vi: tài khoản Windows hiện tại" + Environment.NewLine + "Nguồn WebView2: Microsoft" + Environment.NewLine + Environment.NewLine + history.ToString() };
                dialog.Controls.Add(text);
                var close = new Button { Text = "Đóng", Dock = DockStyle.Bottom, Height = 38, DialogResult = DialogResult.Cancel };
                dialog.Controls.Add(close);
                dialog.CancelButton = close;
                text.BringToFront();
                dialog.ShowDialog(this);
            }
        }

        private sealed class StepRow : Control
        {
            private readonly int number;
            private readonly string title;
            private string subtitle = "Đang chờ";
            private int state;
            public StepRow(int number, string title) { this.number = number; this.title = title; DoubleBuffered = true; TabStop = false; }
            public void SetState(int value, string detail) { state = value; subtitle = detail; AccessibleName = title + ": " + detail; Invalidate(); }
            protected override void OnPaint(PaintEventArgs e)
            {
                e.Graphics.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
                if (state == 2) using (var brush = new SolidBrush(Color.FromArgb(239, 236, 255))) e.Graphics.FillRectangle(brush, ClientRectangle);
                Color color = state == 1 ? Green : state == 2 ? Accent : state == -1 ? Color.FromArgb(170, 70, 45) : Color.FromArgb(155, 166, 186);
                using (var pen = new Pen(color, 2)) e.Graphics.DrawEllipse(pen, 13, 17, 25, 25);
                using (var font = new Font("Segoe UI", 10, FontStyle.Bold)) TextRenderer.DrawText(e.Graphics, number.ToString(), font, new Rectangle(13, 17, 25, 25), color, TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter);
                using (var font = new Font("Segoe UI", 10.5f, FontStyle.Bold)) TextRenderer.DrawText(e.Graphics, title, font, new Rectangle(48, 14, Width - 50, 35), state == 2 ? Accent : Ink, TextFormatFlags.WordBreak);
                using (var font = new Font("Segoe UI", 9.5f)) TextRenderer.DrawText(e.Graphics, subtitle, font, new Rectangle(48, 53, Width - 50, 35), Muted, TextFormatFlags.WordBreak);
                if (number < 4) using (var pen = new Pen(Line, 1)) e.Graphics.DrawLine(pen, 26, 49, 26, Height);
            }
        }

        private sealed class AccentProgressBar : ProgressBar
        {
            [DllImport("uxtheme.dll", CharSet = CharSet.Unicode)] private static extern int SetWindowTheme(IntPtr window, string app, string ids);
            [DllImport("user32.dll")] private static extern IntPtr SendMessage(IntPtr window, int message, IntPtr w, IntPtr l);
            protected override void OnHandleCreated(EventArgs e)
            {
                base.OnHandleCreated(e);
                SetWindowTheme(Handle, "", "");
                SendMessage(Handle, 0x0409, IntPtr.Zero, new IntPtr(ColorTranslator.ToWin32(Accent)));
                SendMessage(Handle, 0x2001, IntPtr.Zero, new IntPtr(ColorTranslator.ToWin32(Line)));
            }
        }
    }
}
