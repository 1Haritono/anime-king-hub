// Cloud Watch Progress Sync Service for AnixApp (v0.1.50)
const STORAGE_KEY = 'sync_pairing_code';
const BASE_URL = 'https://kvdb.io/4y9y2g2K9WzS8wZ2V1Y9m1'; // Open KV store bucket

export interface ProgressPayload {
  animeId: string;
  episode: number;
  time: number;
  duration: number;
  updatedAt: number;
}

/**
 * Get current 6-digit pairing code or generate new one
 */
export function getPairingCode(): string {
  let code = localStorage.getItem(STORAGE_KEY);
  if (!code) {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem(STORAGE_KEY, code);
  }
  return code;
}

/**
 * Set a custom pairing code
 */
export function setPairingCode(newCode: string): boolean {
  const cleanCode = String(newCode).trim();
  if (cleanCode.length === 6 && /^\d+$/.test(cleanCode)) {
    localStorage.setItem(STORAGE_KEY, cleanCode);
    return true;
  }
  return false;
}

/**
 * Format seconds into MM:SS or HH:MM:SS
 */
export function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Send watch progress to Cloud API
 */
export async function sendProgress(animeId: string | number, episode: number, currentTime: number, duration: number): Promise<void> {
  const pairingCode = getPairingCode();
  if (!pairingCode || !animeId || currentTime <= 3) return;

  const payload: ProgressPayload = {
    animeId: String(animeId),
    episode: episode || 1,
    time: Math.floor(currentTime),
    duration: Math.floor(duration || 0),
    updatedAt: Date.now()
  };

  // Save to local cache
  try {
    localStorage.setItem(`sync_last_${pairingCode}`, JSON.stringify(payload));
  } catch (e) {}

  // Send to Cloud API silently
  try {
    const key = `sync_${pairingCode}_${animeId}_${episode || 1}`;
    await fetch(`${BASE_URL}/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    // Quiet error handling
  }
}

/**
 * Fetch watch progress from Cloud API
 */
export async function fetchProgress(animeId: string | number, episode: number): Promise<ProgressPayload | null> {
  const pairingCode = getPairingCode();
  if (!pairingCode || !animeId) return null;

  const key = `sync_${pairingCode}_${animeId}_${episode || 1}`;

  try {
    const res = await fetch(`${BASE_URL}/${key}?t=${Date.now()}`);
    if (!res.ok) return null;
    const data: ProgressPayload = await res.json();
    
    if (data && data.time > 5) {
      return data;
    }
  } catch (err) {
    // Fallback to local storage
    try {
      const cached = localStorage.getItem(`sync_last_${pairingCode}`);
      if (cached) {
        const parsed: ProgressPayload = JSON.parse(cached);
        if (parsed.animeId === String(animeId) && parsed.time > 5) {
          return parsed;
        }
      }
    } catch (e) {}
  }
  return null;
}
