export type UpdateChannel = "stable" | "preview";
export interface UpdateOffer { token: string; version: string; notes: string; pubDate: string | null; downloaded: boolean }
export interface UpdateStatus { currentVersion: string; channel: UpdateChannel; supported: boolean; canInstall: boolean; lastCheckedAt: number | null; available: UpdateOffer | null; message: string }
export interface UpdateProgress { stage: "downloading" | "verifying"; downloadedBytes: number; totalBytes: number | null }
export interface UpdateAdapter {
  status(): Promise<UpdateStatus>;
  channel(channel: UpdateChannel): Promise<UpdateStatus>;
  check(manual: boolean): Promise<UpdateStatus>;
  download(token: string, progress: (event: UpdateProgress) => void): Promise<UpdateStatus>;
  cancel(): Promise<void>;
  install(token: string): Promise<void>;
}
