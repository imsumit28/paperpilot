'use client';

/**
 * Per-device / per-browser identity.
 *
 * The backend stores assignments in a single shared collection and (until a
 * real authenticated account system exists) has no other way to tell one
 * client apart from another. We generate a random id on first launch, persist
 * it in localStorage, and send it with every API request so the backend can
 * scope all reads/writes to the originating device. This is what keeps Device A
 * from seeing Device B's assignments.
 *
 * localStorage is already isolated per browser/profile, so a fresh browser or
 * an incognito window naturally gets a brand-new id (and therefore an empty,
 * independent dataset) the first time this runs.
 */
const DEVICE_ID_KEY = 'paper-pilot-device-id';

let cached: string | null = null;

function generateId(): string {
  // Prefer the platform UUID generator; fall back for older browsers.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `dev_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

/**
 * Returns this device's stable id, creating and persisting one on first call.
 * Returns an empty string during SSR (no localStorage); the value is resolved
 * again on the client where it matters.
 */
export function getDeviceId(): string {
  if (cached) return cached;
  if (typeof window === 'undefined') return '';

  try {
    let id = window.localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = generateId();
      window.localStorage.setItem(DEVICE_ID_KEY, id);
    }
    cached = id;
    return id;
  } catch {
    // Storage blocked (e.g. hardened privacy mode): fall back to an in-memory
    // id so the app still works for the lifetime of the tab.
    if (!cached) cached = generateId();
    return cached;
  }
}

export { DEVICE_ID_KEY };
