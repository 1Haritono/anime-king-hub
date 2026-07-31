// Local Watch History & Analytics Engine for Anime King Hub

const STORAGE_KEY = 'animeking_watch_history';
const POSITION_KEY = 'animeking_playback_positions';
const RATINGS_KEY = 'animeking_ratings';

function getStorage(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setStorage(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
}

// Log episode viewing
export function logEpisodeWatch(anime, episodeNum, dubName = 'Озвучка РуАниме / DEEP', playerName = 'Плеер Alloha', durationMinutes = 24) {
  if (!anime || !anime.id) return;
  const history = getStorage(STORAGE_KEY, []);
  
  if (history.length > 0) {
    const lastLog = history[0];
    const timeDiff = Date.now() - lastLog.timestamp;
    if (lastLog.animeId === anime.id && lastLog.episodeNumber === Number(episodeNum) && timeDiff < 5 * 60 * 1000) {
      // Prevent duplicate logs (StrictMode / rapid re-clicks)
      return;
    }
  }

  const record = {
    id: `${anime.id}_ep${episodeNum}_${Date.now()}`,
    animeId: anime.id,
    title: anime.title || 'Аниме',
    posterUrl: anime.posterUrl || '',
    episodeNumber: Number(episodeNum),
    dubName,
    playerName,
    durationMinutes,
    timestamp: Date.now()
  };

  history.unshift(record);
  // Keep last 200 logs
  setStorage(STORAGE_KEY, history.slice(0, 200));
}

// Save playback timestamp
export function savePlaybackPosition(animeId, episodeNum, timestampSeconds) {
  const positions = getStorage(POSITION_KEY, {});
  const key = `${animeId}_ep${episodeNum}`;
  positions[key] = {
    timestampSeconds: Math.floor(timestampSeconds),
    savedAt: Date.now()
  };
  setStorage(POSITION_KEY, positions);
}

// Get playback timestamp
export function getPlaybackPosition(animeId, episodeNum) {
  const positions = getStorage(POSITION_KEY, {});
  const key = `${animeId}_ep${episodeNum}`;
  return positions[key]?.timestampSeconds || 0;
}

// Save title rating
export function saveAnimeRating(anime, starRating) {
  if (!anime || !anime.id) return;
  const ratings = getStorage(RATINGS_KEY, []);
  const existingIdx = ratings.findIndex(r => r.animeId === anime.id);
  const entry = {
    animeId: anime.id,
    title: anime.title,
    posterUrl: anime.posterUrl,
    rating: starRating,
    timestamp: Date.now()
  };

  if (existingIdx >= 0) {
    ratings[existingIdx] = entry;
  } else {
    ratings.unshift(entry);
  }
  setStorage(RATINGS_KEY, ratings);
}

// Helper to format relative time strings (e.g. "16 сек назад", "6 мин назад", "сегодня в 02:01", "27 июл. в 21:23")
export function formatRelativeTime(timestamp) {
  const now = Date.now();
  const diffSec = Math.floor((now - timestamp) / 1000);

  if (diffSec < 60) return `${diffSec || 1} сек назад`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} мин назад`;

  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  if (date.toDateString() === today.toDateString()) {
    return `сегодня в ${timeStr}`;
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return `вчера в ${timeStr}`;
  }

  const day = date.getDate();
  const months = ['янв.', 'февр.', 'мар.', 'апр.', 'мая', 'июня', 'июля', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.'];
  const month = months[date.getMonth()];
  return `${day} ${month}. в ${timeStr}`;
}

// Compute Profile Analytics
export function getProfileAnalytics() {
  const history = getStorage(STORAGE_KEY, []);
  const ratings = getStorage(RATINGS_KEY, []);
  
  // Real data only: no fake fallbacks for production
  const activeHistory = history;
  const activeRatings = ratings;

  // Status Distribution (Computed from real data)
  // "watching" = unique anime titles in history
  const uniqueWatchedIds = new Set(history.map(h => h.animeId));
  // "planned" = number of bookmarks
  const bookmarks = getStorage('bookmarks', []);

  const statusCounts = {
    watching: uniqueWatchedIds.size,
    planned: bookmarks.length,
    completed: 0,
    onHold: 0,
    dropped: 0
  };

  const totalEpisodes = history.length;
  // sum duration in minutes (if available, else assume 24)
  const totalMinutes = history.reduce((acc, curr) => acc + (curr.durationMinutes || 24), 0);
  const totalWatchHours = Math.floor(totalMinutes / 60);

  // 7-day Episode Velocity Bar Chart
  const days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const label = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
    
    // Count real logs for this day
    const count = activeHistory.filter(h => {
      const hDate = new Date(h.timestamp);
      return hDate.toDateString() === d.toDateString();
    }).length;

    days.push({ dateLabel: label, count: count });
  }

  return {
    statusCounts,
    totalEpisodes,
    totalWatchHours,
    recentHistory: activeHistory.slice(0, 10),
    ratings: activeRatings
  };
}
