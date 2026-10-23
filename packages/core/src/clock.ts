export type ClockMode = "focus" | "countdown" | "stopwatch";
export type ClockLayout = "minimal" | "session" | "digital";
export type ClockTheme = "app" | "light" | "dark";
export type ClockStatus = "idle" | "running" | "paused" | "finished";
export const MAX_CLOCK_MS = 604_800_000;
export interface ClockState {
  version: 1;
  layout: ClockLayout;
  theme: ClockTheme;
  mode: ClockMode;
  status: ClockStatus;
  focusMinutes: number;
  countdownSeconds: number;
  durationMs: number;
  elapsedMs: number;
  startedAt: number | null;
  sessionStartedAt: number | null;
  sessionId: string | null;
  title: string;
  note: string;
}
export interface ClockSession {
  id: string;
  mode: ClockMode;
  title: string;
  note: string;
  startedAt: number;
  endedAt: number;
  elapsedMs: number;
  targetMs: number;
  outcome: "completed" | "stopped";
}
export interface ClockSnapshot { revision: number; state: ClockState; history: ClockSession[] }
export interface ClockRepository {
  load(): Promise<ClockSnapshot>;
  save(state: ClockState, expectedRevision: number, completed: ClockSession | null): Promise<number>;
}
export function defaultClock(): ClockState {
  return { version: 1, layout: "minimal", theme: "app", mode: "focus", status: "idle", focusMinutes: 25, countdownSeconds: 600, durationMs: 1_500_000, elapsedMs: 0, startedAt: null, sessionStartedAt: null, sessionId: null, title: "", note: "" };
}
const integer = (v: unknown, min: number, max: number): v is number => Number.isSafeInteger(v) && (v as number) >= min && (v as number) <= max;
const text = (v: unknown, max: number) => typeof v === "string" && [...v].length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/.test(v);
export function validClock(value: unknown): value is ClockState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const s = value as ClockState;
  if (Object.keys(s).length !== 14 || Object.keys(defaultClock()).some(key => !Object.hasOwn(s, key))) return false;
  if (s.version !== 1 || !["minimal", "session", "digital"].includes(s.layout) || !["app", "light", "dark"].includes(s.theme) || !["focus", "countdown", "stopwatch"].includes(s.mode) || !["idle", "running", "paused", "finished"].includes(s.status)) return false;
  if (!integer(s.focusMinutes, 1, 180) || !integer(s.countdownSeconds, 1, 86_399) || !integer(s.durationMs, 0, MAX_CLOCK_MS) || !integer(s.elapsedMs, 0, MAX_CLOCK_MS) || !text(s.title, 120) || !text(s.note, 500)) return false;
  if (s.durationMs !== (s.mode === "focus" ? s.focusMinutes * 60_000 : s.mode === "countdown" ? s.countdownSeconds * 1000 : 0)) return false;
  if (s.sessionId !== null && (typeof s.sessionId !== "string" || !/^[a-zA-Z0-9-]{1,80}$/.test(s.sessionId))) return false;
  if (s.sessionStartedAt !== null && !integer(s.sessionStartedAt, 1, 8_640_000_000_000_000)) return false;
  if (s.startedAt !== null && !integer(s.startedAt, 1, 8_640_000_000_000_000)) return false;
  if (s.status === "idle") return s.sessionId === null && s.sessionStartedAt === null && s.startedAt === null && s.elapsedMs === 0;
  return s.sessionId !== null && s.sessionStartedAt !== null && (s.status === "running" ? s.startedAt !== null : s.startedAt === null);
}
export function validClockSession(v: unknown): v is ClockSession {
  if (!v || typeof v !== "object") return false;
  const s = v as ClockSession;
  return Object.keys(s).length === 9 && typeof s.id === "string" && /^[a-zA-Z0-9-]{1,80}$/.test(s.id) && ["focus", "countdown", "stopwatch"].includes(s.mode) && text(s.title, 120) && text(s.note, 500) && integer(s.startedAt, 1, 8_640_000_000_000_000) && integer(s.endedAt, s.startedAt, 8_640_000_000_000_000) && integer(s.elapsedMs, 0, MAX_CLOCK_MS) && integer(s.targetMs, 0, MAX_CLOCK_MS) && ["completed", "stopped"].includes(s.outcome);
}
export function elapsedClock(s: ClockState, now = Date.now()): number {
  return Math.min(MAX_CLOCK_MS, s.elapsedMs + (s.status === "running" && s.startedAt !== null ? Math.max(0, now - s.startedAt) : 0));
}
export function displayedClock(s: ClockState, now = Date.now()): number {
  const elapsed = elapsedClock(s, now);
  return s.mode === "stopwatch" ? elapsed : Math.max(0, s.durationMs - elapsed);
}
export function startClock(s: ClockState, now: number, id: string): ClockState {
  if (s.status === "running") return s;
  if (s.status === "paused") return { ...s, status: "running", startedAt: now };
  return { ...s, status: "running", elapsedMs: 0, startedAt: now, sessionStartedAt: now, sessionId: id };
}
export function pauseClock(s: ClockState, now: number): ClockState {
  return s.status === "running" ? { ...s, status: "paused", elapsedMs: elapsedClock(s, now), startedAt: null } : s;
}
export function finishClock(s: ClockState, now: number, automatic = false): { state: ClockState; completed: ClockSession | null } {
  if ((s.status !== "running" && s.status !== "paused") || !s.sessionId || !s.sessionStartedAt) return { state: s, completed: null };
  const elapsedMs = automatic && s.mode !== "stopwatch" ? s.durationMs : elapsedClock(s, now);
  const endedAt = automatic && s.mode !== "stopwatch" && s.startedAt !== null ? s.startedAt + s.durationMs - s.elapsedMs : now;
  return { state: { ...s, status: "finished", elapsedMs, startedAt: null }, completed: { id: s.sessionId, mode: s.mode, title: s.title, note: s.note, startedAt: s.sessionStartedAt, endedAt: Math.max(s.sessionStartedAt, endedAt), elapsedMs, targetMs: s.durationMs, outcome: automatic ? "completed" : "stopped" } };
}
export function reconcileClock(s: ClockState, now: number) {
  return s.status === "running" && elapsedClock(s, now) >= (s.mode === "stopwatch" ? MAX_CLOCK_MS : s.durationMs) ? finishClock(s, now, true) : { state: s, completed: null };
}
export function switchClockMode(s: ClockState, mode: ClockMode): ClockState {
  if (s.status === "running" || s.status === "paused") throw new Error("Kết thúc phiên hiện tại trước khi đổi chế độ.");
  return { ...s, mode, status: "idle", elapsedMs: 0, sessionId: null, sessionStartedAt: null, startedAt: null, durationMs: mode === "focus" ? s.focusMinutes * 60_000 : mode === "countdown" ? s.countdownSeconds * 1000 : 0 };
}
export function formatClock(ms: number, hours = false, countdown = false): string {
  const seconds = Math.max(0, countdown ? Math.ceil(ms / 1000) : Math.floor(ms / 1000));
  const h = Math.floor(seconds / 3600), m = Math.floor((hours || h ? seconds % 3600 : seconds) / 60), s = seconds % 60;
  return `${hours || h ? String(h).padStart(2, "0") + ":" : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
