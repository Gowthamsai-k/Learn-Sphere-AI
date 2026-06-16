import crypto from 'crypto';

const DEFAULT_TTL = 60 * 60 * 24 * 7; // 7 days

// In-memory session store
const memoryStore = new Map<string, { data: any; expiresAt: number }>();

export async function createSession(data: Record<string, any>, ttl = DEFAULT_TTL) {
  const sid = crypto.randomUUID();
  const expiresAt = Date.now() + ttl * 1000;
  memoryStore.set(sid, { data, expiresAt });
  // schedule cleanup
  setTimeout(() => memoryStore.delete(sid), ttl * 1000 + 1000);
  return sid;
}

export async function getSession(sid: string) {
  const rec = memoryStore.get(sid);
  if (!rec) return null;
  if (Date.now() > rec.expiresAt) {
    memoryStore.delete(sid);
    return null;
  }
  return rec.data;
}

export async function destroySession(sid: string) {
  memoryStore.delete(sid);
}

export async function refreshSession(sid: string, ttl = DEFAULT_TTL) {
  const rec = memoryStore.get(sid);
  if (rec) {
    rec.expiresAt = Date.now() + ttl * 1000;
    memoryStore.set(sid, rec);
  }
}

export { DEFAULT_TTL };
