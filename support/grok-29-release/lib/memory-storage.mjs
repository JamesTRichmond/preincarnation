export function memoryStorage(initial = {}) {
  const mem = new Map(Object.entries(initial));
  let failOn = null;
  let failOnNth = null;
  let setCount = 0;
  const storage = {
    get length() {
      return mem.size;
    },
    key(index) {
      return [...mem.keys()][index] ?? null;
    },
    getItem(key) {
      if (failOn === "get") {
        const err = new Error("SecurityError");
        err.name = "SecurityError";
        throw err;
      }
      return mem.has(key) ? mem.get(key) : null;
    },
    setItem(key, value) {
      setCount += 1;
      if (failOn === "set" || failOn === key || setCount === failOnNth) {
        const err = new Error("QuotaExceededError");
        err.name = "QuotaExceededError";
        throw err;
      }
      mem.set(key, String(value));
    },
    removeItem(key) {
      if (failOn === "remove") {
        const err = new Error("QuotaExceededError");
        err.name = "QuotaExceededError";
        throw err;
      }
      mem.delete(key);
    },
    clear() {
      mem.clear();
    },
    dump() {
      return Object.fromEntries(mem);
    },
    failOn(keyOrMode) {
      failOn = keyOrMode;
    },
    failOnNthSet(n) {
      failOnNth = n;
    },
  };
  return storage;
}

export function memoryDeck(initial = []) {
  let records = initial.map((entry) => ({ ...entry, bytes: Uint8Array.from(entry.bytes) }));
  let fail = false;
  return {
    async entries() {
      return records.map((entry) => ({ ...entry, bytes: Uint8Array.from(entry.bytes) }));
    },
    async replace(next) {
      if (fail) {
        const err = new Error("QuotaExceededError");
        err.name = "QuotaExceededError";
        throw err;
      }
      records = next.map((entry) => ({
        key: entry.key,
        mediaType: entry.mediaType,
        bytes: Uint8Array.from(entry.bytes),
      }));
    },
    failNext() {
      fail = true;
    },
    snapshot() {
      return records.map((entry) => ({ key: entry.key, mediaType: entry.mediaType, bytes: [...entry.bytes] }));
    },
  };
}
