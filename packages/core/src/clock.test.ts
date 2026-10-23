import { describe, expect, it } from "vitest";
import { defaultClock, displayedClock, elapsedClock, finishClock, formatClock, pauseClock, reconcileClock, startClock, switchClockMode, validClock, validClockSession } from "./clock";

describe("Clock timekeeping and persisted contracts", () => {
  it("counts wall time across a suspended window without interval drift", () => {
    const state = startClock(defaultClock(), 1_000, "session-1");
    expect(displayedClock(state, 601_000)).toBe(900_000);
    expect(state.elapsedMs).toBe(0);
  });
  it("excludes paused wall time when resumed", () => {
    const paused = pauseClock(startClock(defaultClock(), 1_000, "session-1"), 61_000);
    expect(elapsedClock(paused, 500_000)).toBe(60_000);
    const resumed = startClock(paused, 1_000_000, "ignored-id");
    expect(resumed.sessionId).toBe("session-1");
    expect(displayedClock(resumed, 1_060_000)).toBe(1_380_000);
  });
  it("saves an overdue countdown once with its actual deadline", () => {
    const state = startClock(switchClockMode(defaultClock(), "countdown"), 1_000, "countdown-1");
    const result = reconcileClock(state, 10_000_000);
    expect(result.completed?.endedAt).toBe(601_000);
    expect(result.completed?.elapsedMs).toBe(600_000);
    expect(result.completed?.outcome).toBe("completed");
    expect(reconcileClock(result.state, 10_001_000).completed).toBeNull();
    expect(validClock(result.state)).toBe(true);
    expect(validClockSession(result.completed)).toBe(true);
  });
  it("calculates expiry correctly after a pause", () => {
    const paused = pauseClock(startClock(defaultClock(), 1_000, "session-1"), 61_000);
    const resumed = startClock(paused, 1_000_000, "ignored");
    expect(reconcileClock(resumed, 9_000_000).completed?.endedAt).toBe(2_440_000);
  });
  it.each(["minimal", "session", "digital"] as const)("switches to %s without changing the running session", layout => {
    const running = startClock(defaultClock(), 1_000, "session-1");
    const changed = { ...running, layout, theme: "dark" as const };
    expect(validClock(changed)).toBe(true);
    expect(displayedClock(changed, 10_000)).toBe(displayedClock(running, 10_000));
    expect(changed.sessionId).toBe(running.sessionId);
  });
  it("keeps stopwatch time and stores a manual finish", () => {
    const running = startClock(switchClockMode(defaultClock(), "stopwatch"), 1_000, "stopwatch-1");
    expect(formatClock(displayedClock(running, 91_001))).toBe("01:30");
    const result = finishClock(running, 91_001);
    expect(result.completed?.elapsedMs).toBe(90_001);
    expect(result.completed?.targetMs).toBe(0);
    expect(result.completed?.outcome).toBe("stopped");
  });
  it("requires finishing before switching modes", () => {
    const running = startClock(defaultClock(), 1_000, "session-1");
    expect(() => switchClockMode(running, "countdown")).toThrow();
    expect(() => switchClockMode(pauseClock(running, 2_000), "countdown")).toThrow();
    expect(switchClockMode(finishClock(running, 2_000).state, "countdown").status).toBe("idle");
  });
  it("starts a new session after finishing", () => {
    const finished = finishClock(startClock(defaultClock(), 1_000, "session-1"), 61_000).state;
    const next = startClock(finished, 100_000, "session-2");
    expect(next.elapsedMs).toBe(0);
    expect(next.sessionId).toBe("session-2");
    expect(next.sessionStartedAt).toBe(100_000);
  });
  it("tolerates a wall clock adjustment without negative elapsed time", () => {
    expect(elapsedClock(startClock(defaultClock(), 10_000, "s"), 1_000)).toBe(0);
  });
  it.each([
    { layout: "unknown" }, { countdownSeconds: 0 }, { durationMs: 10 },
    { elapsedMs: NaN }, { title: "x".repeat(121) }, { note: "\u0000" },
    { extra: true }, { status: "running" },
  ])("rejects malformed stored state %j", patch => expect(validClock({ ...defaultClock(), ...patch })).toBe(false));
  it("formats countdowns without displaying zero before expiry", () => {
    expect(formatClock(1, false, true)).toBe("00:01");
    expect(formatClock(3_601_000, true)).toBe("01:00:01");
    expect(formatClock(0)).toBe("00:00");
  });
});
