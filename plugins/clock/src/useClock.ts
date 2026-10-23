import { useCallback, useEffect, useRef, useState } from "react";
import { defaultClock, displayedClock, finishClock, pauseClock, reconcileClock, startClock, switchClockMode, type ClockMode, type ClockRepository, type ClockSession, type ClockState } from "@nuvokit/core";

const message = (reason: unknown) => String(reason instanceof Error ? reason.message : reason).replace(/^(?:Error:\s*)+/, "");

type Write = { state: ClockState; completed: ClockSession | null };
export function useClock(repository: ClockRepository) {
  const [state, setState] = useState(defaultClock);
  const [history, setHistory] = useState<ClockSession[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now);
  const current = useRef(state);
  const revision = useRef(0);
  const queue = useRef<Write[]>([]);
  const writing = useRef(false);
  const failed = useRef(false);
  const ready = useRef(false);
  const alive = useRef(false);
  const generation = useRef(0);

  const drain = useCallback(async () => {
    if (writing.current || failed.current || !ready.current) return;
    writing.current = true;
    setPending(true);
    try {
      while (queue.current.length) {
        const item = queue.current[0];
        revision.current = await repository.save(item.state, revision.current, item.completed);
        queue.current.shift();
      }
    } catch (reason) {
      failed.current = true;
      if (alive.current) setError(message(reason));
    } finally {
      writing.current = false;
      if (alive.current) setPending(queue.current.length > 0);
    }
  }, [repository]);

  const commit = useCallback((next: ClockState, completed: ClockSession | null = null) => {
    current.current = next;
    setState(next);
    setNow(Date.now());
    if (completed) setHistory(items => [completed, ...items.filter(item => item.id !== completed.id)].slice(0, 50));
    // Coalesce text/appearance edits, but never drop an in-flight write or a completed session.
    const last = queue.current.length - 1;
    if (last > (writing.current ? 0 : -1) && !queue.current[last].completed && !completed) queue.current[last] = { state: next, completed };
    else queue.current.push({ state: next, completed });
    void drain();
  }, [drain]);

  const reload = useCallback(async () => {
    if (writing.current || queue.current.length) throw new Error("Chờ Đồng hồ lưu xong trước khi tải lại.");
    const id = ++generation.current;
    ready.current = false;
    setLoaded(false);
    try {
      const snapshot = await repository.load();
      if (!alive.current || id !== generation.current) return;
      current.current = snapshot.state;
      revision.current = snapshot.revision;
      setState(snapshot.state);
      setHistory(snapshot.history);
      setError(""); failed.current = false; ready.current = true; setLoaded(true);
      const result = reconcileClock(snapshot.state, Date.now());
      if (result.completed) commit(result.state, result.completed);
    } catch (reason) {
      if (alive.current && id === generation.current) { setError(message(reason)); setLoaded(false); }
    }
  }, [repository, commit]);

  useEffect(() => {
    alive.current = true;
    void reload();
    return () => { alive.current = false; generation.current++; };
  }, [reload]);

  const reconcile = useCallback(() => {
    const time = Date.now(); setNow(time);
    if (!ready.current || failed.current) return;
    const result = reconcileClock(current.current, time);
    if (result.completed) commit(result.state, result.completed);
  }, [commit]);
  useEffect(() => {
    if (!loaded || state.status !== "running") return;
    const timer = window.setInterval(reconcile, 250);
    const visible = () => { if (document.visibilityState === "visible") reconcile(); };
    window.addEventListener("focus", reconcile);
    document.addEventListener("visibilitychange", visible);
    return () => { clearInterval(timer); window.removeEventListener("focus", reconcile); document.removeEventListener("visibilitychange", visible); };
  }, [loaded, state.status, reconcile]);
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => { if (queue.current.length) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, []);

  function act(transform: (s: ClockState, time: number) => Write) {
    if (!ready.current || failed.current) return;
    const time = Date.now();
    const overdue = reconcileClock(current.current, time);
    if (overdue.completed) { commit(overdue.state, overdue.completed); return; }
    const next = transform(current.current, time);
    commit(next.state, next.completed);
  }
  return {
    state, history, loaded, pending, error, now,
    remaining: displayedClock(state, now),
    active: state.status === "running" || state.status === "paused",
    start: () => act((s, time) => ({ state: startClock(s, time, crypto.randomUUID()), completed: null })),
    pause: () => act((s, time) => ({ state: pauseClock(s, time), completed: null })),
    finish: () => act((s, time) => finishClock(s, time)),
    mode: (mode: ClockMode) => act(s => ({ state: switchClockMode(s, mode), completed: null })),
    edit: (patch: Partial<Pick<ClockState, "layout" | "theme" | "title" | "note">>) => act(s => ({ state: { ...s, ...patch }, completed: null })),
    duration: (value: number) => act(s => {
      if (s.status === "running" || s.status === "paused") return { state: s, completed: null };
      const next = s.mode === "focus" ? { ...s, focusMinutes: value } : { ...s, countdownSeconds: value };
      return { state: switchClockMode(next, s.mode), completed: null };
    }),
    retry: () => { if (!ready.current) void reload(); else { failed.current = false; setError(""); reconcile(); void drain(); } },
    readStored: async () => {
      if (writing.current) return;
      queue.current = []; setPending(false); failed.current = false;
      await reload();
    },
    reload,
  };
}
export type ClockController = ReturnType<typeof useClock>;
