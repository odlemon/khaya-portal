/** After this idle period, user is logged out on return or reload. */
export const IDLE_LOGOUT_MS = 5 * 60 * 1000;

const LAST_HIDDEN_KEY = 'khaya_last_hidden_at';

export function markTabHidden(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(LAST_HIDDEN_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

export function clearIdleMark(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(LAST_HIDDEN_KEY);
  } catch {
    // ignore
  }
}

export function getIdleDurationMs(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(LAST_HIDDEN_KEY);
    if (!raw) return null;
    const hiddenAt = Number(raw);
    if (!Number.isFinite(hiddenAt)) return null;
    return Date.now() - hiddenAt;
  } catch {
    return null;
  }
}

export function wasIdleLongEnough(thresholdMs = IDLE_LOGOUT_MS): boolean {
  const idle = getIdleDurationMs();
  return idle != null && idle >= thresholdMs;
}
