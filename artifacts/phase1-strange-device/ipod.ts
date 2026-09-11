/** Phase 1 Strange Device deck — hoist this into src/game/ipod.ts. */

export type DeckTrack = {
  id: string;
  title: string;
  fileName: string;
  duration: number;
};

export type DeckStatus = {
  track: DeckTrack | null;
  playing: boolean;
  position: number;
  duration: number;
};

export type DeckMeta = {
  tracks: DeckTrack[];
  nowPlayingId: string | null;
  position: number;
};

export const EMPTY_DECK: DeckMeta = {
  tracks: [],
  nowPlayingId: null,
  position: 0,
};

const DB_NAME = "preincarnation.deck.v1";
const STORE = "files";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbPut(id: string, blob: Blob) {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(blob, id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      }),
  );
}

function idbGet(id: string) {
  return openDb().then(
    (db) =>
      new Promise<Blob | undefined>((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).get(id);
        req.onsuccess = () => resolve(req.result as Blob | undefined);
        req.onerror = () => reject(req.error);
      }),
  );
}

function prettyTitle(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || "Untitled";
}

export function createDeck() {
  const audio = document.createElement("audio");
  audio.preload = "metadata";
  audio.setAttribute("playsinline", "true");
  let url: string | null = null;
  let meta: DeckMeta = { tracks: [], nowPlayingId: null, position: 0 };
  let duck: (on: boolean) => void = () => {};
  let onChange: () => void = () => {};
  let lastPersist = 0;

  const current = () => meta.tracks.find((t) => t.id === meta.nowPlayingId) ?? meta.tracks[0] ?? null;

  const revoke = () => {
    if (url) {
      URL.revokeObjectURL(url);
      url = null;
    }
  };

  const attach = async (id: string, start: number) => {
    const blob = await idbGet(id);
    if (!blob) return false;
    revoke();
    url = URL.createObjectURL(blob);
    audio.src = url;
    audio.currentTime = Math.max(0, start);
    return true;
  };

  const status = (): DeckStatus => {
    const track = current();
    return {
      track,
      playing: !audio.paused && !audio.ended,
      position: audio.currentTime || meta.position,
      duration: Number.isFinite(audio.duration) ? audio.duration : track?.duration ?? 0,
    };
  };

  audio.addEventListener("timeupdate", () => {
    meta.position = audio.currentTime;
    const t = current();
    if (t && Number.isFinite(audio.duration) && audio.duration > 0) t.duration = audio.duration;
    const now = Date.now();
    if (now - lastPersist > 2000) {
      lastPersist = now;
      onChange();
    }
  });
  audio.addEventListener("play", () => {
    duck(true);
    onChange();
  });
  audio.addEventListener("pause", () => {
    duck(false);
    onChange();
  });
  audio.addEventListener("ended", () => {
    duck(false);
    onChange();
  });

  return {
    status,
    snapshot: (): DeckMeta => ({
      tracks: meta.tracks.map((t) => ({ ...t })),
      nowPlayingId: meta.nowPlayingId,
      position: audio.currentTime || meta.position,
    }),
    setDuck: (fn: (on: boolean) => void) => {
      duck = fn;
    },
    setOnChange: (fn: () => void) => {
      onChange = fn;
    },
    hydrate: async (saved: Partial<DeckMeta> | undefined) => {
      meta = {
        tracks: saved?.tracks ?? [],
        nowPlayingId: saved?.nowPlayingId ?? saved?.tracks?.[0]?.id ?? null,
        position: saved?.position ?? 0,
      };
      const id = meta.nowPlayingId;
      if (id) await attach(id, meta.position);
      onChange();
    },
    feedFile: async (file: File) => {
      const id = "file-" + Date.now().toString(36);
      await idbPut(id, file);
      const track: DeckTrack = {
        id,
        title: prettyTitle(file.name),
        fileName: file.name,
        duration: 0,
      };
      meta.tracks = [track];
      meta.nowPlayingId = id;
      meta.position = 0;
      await attach(id, 0);
      try {
        await audio.play();
      } catch {
        /* need a gesture */
      }
      onChange();
      return track;
    },
    play: async () => {
      if (!audio.src && meta.nowPlayingId) await attach(meta.nowPlayingId, meta.position);
      try {
        await audio.play();
      } catch {
        /* ignore */
      }
      onChange();
    },
    pause: () => {
      audio.pause();
      meta.position = audio.currentTime;
      onChange();
    },
    seek: (t: number) => {
      audio.currentTime = Math.max(0, t);
      meta.position = audio.currentTime;
      onChange();
    },
    dispose: () => {
      audio.pause();
      duck(false);
      revoke();
      audio.removeAttribute("src");
    },
  };
}

export type DeckHandle = ReturnType<typeof createDeck>;
