import { defaultClock, validClock, validClockSession, type ClockRepository, type ClockSession, type ClockState } from "@nuvokit/core";

export function browserClock(): ClockRepository {
  let opening: Promise<IDBDatabase> | undefined;
  const database = () => opening ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("nuvokit-clock", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore("state");
      db.createObjectStore("history", { keyPath: "id" }).createIndex("endedAt", "endedAt");
    };
    request.onsuccess = () => { request.result.onversionchange = () => { request.result.close(); opening = undefined; }; resolve(request.result); };
    request.onerror = () => { opening = undefined; reject(new Error("Không mở được dữ liệu Đồng hồ trong trình duyệt.")); };
    request.onblocked = () => { opening = undefined; reject(new Error("Hãy đóng tab Đồng hồ cũ rồi thử lại.")); };
  });
  const row = (value: unknown): { revision: number; state: ClockState } => {
    if (value === undefined) return { revision: 0, state: defaultClock() };
    const entry = value as { revision: number; state: ClockState };
    if (!Number.isSafeInteger(entry.revision) || entry.revision < 0 || !validClock(entry.state)) throw new Error("Dữ liệu Đồng hồ không hợp lệ; đã giữ nguyên để kiểm tra.");
    return entry;
  };
  return {
    load: async () => {
      const db = await database();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(["state", "history"], "readonly");
        let current = { revision: 0, state: defaultClock() };
        const history: ClockSession[] = [];
        let failure = "Không đọc được Đồng hồ.";
        const stateRequest = tx.objectStore("state").get("clock");
        stateRequest.onsuccess = () => { try { current = row(stateRequest.result); } catch (error) { failure = String(error); tx.abort(); } };
        const cursor = tx.objectStore("history").index("endedAt").openCursor(null, "prev");
        cursor.onsuccess = () => {
          const item = cursor.result;
          if (!item || history.length >= 50) return;
          if (!validClockSession(item.value)) { failure = "Lịch sử Đồng hồ không hợp lệ; chưa thay đổi dữ liệu."; tx.abort(); return; }
          history.push(item.value); item.continue();
        };
        tx.oncomplete = () => resolve({ ...current, history });
        tx.onabort = tx.onerror = () => reject(new Error(failure));
      });
    },
    save: async (state, expectedRevision, completed) => {
      if (!validClock(state) || (completed && (!validClockSession(completed) || completed.id !== state.sessionId || state.status !== "finished"))) throw new Error("Trạng thái Đồng hồ không hợp lệ.");
      const db = await database();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(["state", "history"], "readwrite");
        let revision = 0;
        let failure = "Chưa lưu được Đồng hồ. Kiểm tra dung lượng/quyền trình duyệt rồi thử lại.";
        const request = tx.objectStore("state").get("clock");
        request.onsuccess = () => {
          try {
            const previous = row(request.result);
            if (previous.revision !== expectedRevision) throw new Error("Đồng hồ đã thay đổi ở tab khác. Tải lại dữ liệu trước khi ghi tiếp.");
            revision = previous.revision + 1;
            tx.objectStore("state").put({ revision, state }, "clock");
            if (completed) {
              const prior = tx.objectStore("history").get(completed.id);
              prior.onsuccess = () => { if (!prior.result) tx.objectStore("history").add(completed); };
            }
          } catch (error) { failure = String(error); tx.abort(); }
        };
        tx.oncomplete = () => resolve(revision);
        tx.onabort = tx.onerror = () => reject(new Error(failure));
      });
    },
  };
}
