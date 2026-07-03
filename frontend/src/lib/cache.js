const store = new Map();

export function getCached(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiry) {
    store.delete(key);
    return undefined;
  }
  return entry.data;
}

export function setCached(key, data, ttlMs = 60_000) {
  store.set(key, { data, expiry: Date.now() + ttlMs });
}

export function clearCached(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
