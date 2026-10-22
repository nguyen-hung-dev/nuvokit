using System;
using System.Threading;
using System.Threading.Tasks;

namespace NuvoKit.Setup
{
    public enum InstallStage { Check, Runtime, Application, Complete }

    public sealed class Update
    {
        public InstallStage Stage;
        public string Message;
        public string Detail;
        public bool CanCancel;
        public int? Percent;
        public Update(InstallStage stage, string message, string detail, bool canCancel, int? percent = null)
        { Stage = stage; Message = message; Detail = detail; CanCancel = canCancel; Percent = percent; }
    }

    public sealed class CheckResult
    {
        public string RuntimeVersion;
        public long AvailableBytes;
    }

    public interface ISetupOperations
    {
        CheckResult Check(string directory);
        Task EnsureRuntime(IProgress<Update> progress, CancellationToken cancellation);
        Task InstallApplication(string directory, IProgress<Update> progress, CancellationToken cancellation);
        void Launch(string directory);
    }

    public sealed class SetupFailure : Exception
    {
        public readonly bool RebootRequired;
        public SetupFailure(string message, bool rebootRequired = false) : base(message)
        { RebootRequired = rebootRequired; }
    }

    public sealed class SetupController
    {
        private int running;
        private readonly ISetupOperations operations;
        public SetupController(ISetupOperations operations) { this.operations = operations; }

        public async Task Run(string directory, IProgress<Update> progress, CancellationToken cancellation)
        {
            if (Interlocked.CompareExchange(ref running, 1, 0) != 0)
                throw new SetupFailure("Đang có một lượt cài đặt. Vui lòng chờ.");
            try
            {
                progress.Report(new Update(InstallStage.Check, "Đang kiểm tra máy…", "Kiểm tra Windows, thư mục và dung lượng.", true));
                await Task.Run(() => operations.Check(directory), cancellation);
                cancellation.ThrowIfCancellationRequested();
                await operations.EnsureRuntime(progress, cancellation);
                cancellation.ThrowIfCancellationRequested();
                await operations.InstallApplication(directory, progress, cancellation);
                progress.Report(new Update(InstallStage.Complete, "Cài đặt hoàn tất", "NuvoKit đã sẵn sàng. Bạn có thể mở ứng dụng.", false, 100));
            }
            finally { Interlocked.Exchange(ref running, 0); }
        }
    }
}
