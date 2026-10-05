/**
 * Hybrid storage for visual shot images:
 * 1. Global in-memory cache for instantaneous zero-latency component remounts
 * 2. Server-side disk file persistence (/generated-images/...) avoiding browser quota limits
 * 3. IndexedDB fallback
 */

const DB_NAME = 'hejo_visual_db';
const DB_VERSION = 2;
const STORE_NAME = 'shot_images';

// Global window session cache for instant tab transitions
const globalCache: Record<string, string> = 
  typeof window !== 'undefined' 
    ? ((window as any).__hejo_image_cache__ = (window as any).__hejo_image_cache__ || {})
    : {};

let idbDisabled = false;

function canUseIndexedDB(): boolean {
  if (idbDisabled) return false;
  if (typeof window === 'undefined') return false;
  try {
    // Sandboxed iframes without allow-same-origin have opaque 'null' origin where IDB is blocked
    if (window.origin === 'null' || window.location?.protocol === 'about:') {
      idbDisabled = true;
      return false;
    }
    if (!window.indexedDB) {
      idbDisabled = true;
      return false;
    }
    return true;
  } catch {
    idbDisabled = true;
    return false;
  }
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (!canUseIndexedDB()) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const idb = window.indexedDB;
      if (!idb) {
        idbDisabled = true;
        resolve(null);
        return;
      }

      let request: IDBOpenDBRequest;
      try {
        request = idb.open(DB_NAME, DB_VERSION);
      } catch {
        idbDisabled = true;
        resolve(null);
        return;
      }

      request.onupgradeneeded = (event) => {
        try {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        } catch {
          // ignore
        }
      };

      request.onsuccess = () => resolve(request.result);

      request.onerror = (event: any) => {
        idbDisabled = true;
        if (event) {
          if (typeof event.preventDefault === 'function') event.preventDefault();
          if (typeof event.stopPropagation === 'function') event.stopPropagation();
        }
        resolve(null);
      };

      request.onblocked = (event: any) => {
        idbDisabled = true;
        if (event && typeof event.preventDefault === 'function') event.preventDefault();
        resolve(null);
      };
    } catch {
      idbDisabled = true;
      resolve(null);
    }
  });
}

/**
 * Ensures an image URL is a persistent lightweight HTTP URL.
 * If given a large base64 dataUrl, it uploads it to the server disk storage
 * and returns the lightweight persistent URL (e.g. /generated-images/shot_123.jpg).
 */
export async function ensurePersistentImageUrl(dataUrl: string, prefix = 'shot'): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }

  try {
    const res = await fetch('/api/hejo/persist-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl, prefix }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        return data.url;
      }
    }
  } catch (err) {
    console.warn('Failed to persist base64 image to server:', err);
  }

  return dataUrl;
}

export async function saveVisualImageToDb(key: string, dataUrl: string): Promise<string> {
  if (!key || !dataUrl) return dataUrl;

  // 1. Save in immediate global memory cache
  globalCache[key] = dataUrl;

  // 2. If it's a base64 image, asynchronously persist to server disk to get permanent HTTP URL
  let persistentUrl = dataUrl;
  if (dataUrl.startsWith('data:image/')) {
    try {
      persistentUrl = await ensurePersistentImageUrl(dataUrl, key);
      globalCache[key] = persistentUrl;
    } catch {
      // Keep original if network failed
    }
  }

  // 3. Save to IndexedDB if supported
  try {
    const db = await openDatabase();
    if (!db) return persistentUrl;

    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.onerror = (e: any) => {
          if (e && typeof e.preventDefault === 'function') e.preventDefault();
          resolve();
        };
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(persistentUrl, key);
        req.onsuccess = () => resolve();
        req.onerror = (e: any) => {
          if (e && typeof e.preventDefault === 'function') e.preventDefault();
          resolve();
        };
      } catch {
        resolve();
      }
    });
  } catch {
    // IndexedDB failure in sandboxed iframe is gracefully absorbed by server + memory cache
  }

  return persistentUrl;
}

export async function getVisualImageFromDb(key: string): Promise<string | null> {
  // Check memory cache first
  if (globalCache[key]) {
    return globalCache[key];
  }

  try {
    const db = await openDatabase();
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        tx.onerror = (e: any) => {
          if (e && typeof e.preventDefault === 'function') e.preventDefault();
          resolve(null);
        };
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => {
          const val = req.result || null;
          if (val) globalCache[key] = val;
          resolve(val);
        };
        req.onerror = (e: any) => {
          if (e && typeof e.preventDefault === 'function') e.preventDefault();
          resolve(null);
        };
      } catch {
        resolve(null);
      }
    });
  } catch {
    return null;
  }
}

export async function getAllVisualImagesFromDb(): Promise<Record<string, string>> {
  const all: Record<string, string> = { ...globalCache };

  try {
    const db = await openDatabase();
    if (!db) return all;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        tx.onerror = (e: any) => {
          if (e && typeof e.preventDefault === 'function') e.preventDefault();
          resolve(all);
        };
        const store = tx.objectStore(STORE_NAME);

        const req = store.openCursor();
        req.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            all[String(cursor.key)] = cursor.value;
            globalCache[String(cursor.key)] = cursor.value;
            cursor.continue();
          } else {
            resolve(all);
          }
        };
        req.onerror = (e: any) => {
          if (e && typeof e.preventDefault === 'function') e.preventDefault();
          resolve(all);
        };
      } catch {
        resolve(all);
      }
    });
  } catch {
    return all;
  }
}
