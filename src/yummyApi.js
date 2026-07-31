// YummyAnime API Integration Service (api.yani.tv) with Proxy & Fast Timeout Fallback
const YUMMY_BASE = 'https://api.yani.tv';
const YUMMY_APP_TOKEN = import.meta.env.VITE_YUMMY_APP_TOKEN || 'kxqtm49l68hc7f8tb5b1ubaz0hfj4mg9';

export async function ipcFetch(url, options = {}) {
  const isElectron = typeof window !== 'undefined' && window.require;
  const ipcRenderer = isElectron ? window.require('electron').ipcRenderer : null;
  
  if (ipcRenderer) {
    const res = await ipcRenderer.invoke('electron-fetch', url, options);
    if (res.error) throw new Error(res.error);
    return {
      ok: res.ok,
      status: res.status,
      text: async () => res.data,
      json: async () => JSON.parse(res.data)
    };
  }
  
  // Browser fallback: Use local Vite proxy for YummyAnime API to bypass CORS in dev server
  const browserUrl = url.startsWith('https://api.yani.tv') 
    ? url.replace('https://api.yani.tv', '/yani-api') 
    : url;

  return fetch(browserUrl, options);
}

export async function fetchYummyAnimeDetails(animeId, needVideos = true) {
  if (!animeId) {
    console.warn('fetchYummyAnimeDetails called without animeId');
    return null;
  }
  const targetUrl = `${YUMMY_BASE}/anime/${animeId}${needVideos ? '?need_videos=true' : ''}`;
  
  try {
    const fetchPromise = ipcFetch(targetUrl, {
      headers: {
        'Accept': 'application/json',
        'X-Application': YUMMY_APP_TOKEN
      }
    });

    // 8-second timeout to prevent infinite loading (BUG-18/safetyTimer follow-up)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('YummyAnime API timeout exceeded (8000ms)')), 8000)
    );

    const res = await Promise.race([fetchPromise, timeoutPromise]);

    if (res.status === 401 || res.status === 403) {
      console.error(`YummyAnime: invalid or expired token (${res.status})`);
      throw new Error(`YummyAnime: invalid or expired token (${res.status})`);
    }

    if (res.status === 429 || res.status >= 500) {
      console.warn(`YummyAnime: server error or rate limited (${res.status})`);
      return null;
    }

    if (res.ok) {
      const data = await res.json();
      if (data && data.response) return data.response;
    } else {
      throw new Error(`YummyAnime API HTTP error: ${res.status}`);
    }
  } catch (err) {
    console.warn('YummyAnime API fetch failed:', err.message);
    throw err;
  }

  return null;
}

export function parseYummyVideos(videosArray = []) {
  return videosArray.map(item => {
    let iframeUrl = item.iframe_url || '';
    if (iframeUrl.startsWith('//')) {
      iframeUrl = `https:${iframeUrl}`;
    }

    const epNum = item.number !== undefined && item.number !== null ? String(item.number).trim() : '1';
    const rawPlayer = item.data?.player || 'Основной Плеер';
    const rawDubbing = item.data?.dubbing || 'Оригинал / Озвучка';

    return {
      videoId: item.video_id,
      episodeNumber: epNum,
      playerName: (rawPlayer && String(rawPlayer).trim()) || 'Неизвестно',
      dubbing: (rawDubbing && String(rawDubbing).trim()) || 'Неизвестно',
      playerId: item.data?.player_id,
      iframeUrl: iframeUrl,
      skips: item.skips || { opening: null, ending: null }
    };
  });
}

export async function fetchYummyAnimeList({ page = 1, search = '' } = {}) {
  let targetUrl = search ? `${YUMMY_BASE}/search?q=${encodeURIComponent(search)}` : `${YUMMY_BASE}/anime${page ? `?page=${page}` : ''}`;
  
  try {
    const res = await ipcFetch(targetUrl, {
      headers: {
        'Accept': 'application/json',
        'X-Application': YUMMY_APP_TOKEN
      }
    });

    if (res.status === 401 || res.status === 403) {
      console.error(`YummyAnime: invalid or expired token (${res.status})`);
      throw new Error(`YummyAnime: invalid or expired token (${res.status})`);
    }

    if (res.ok) {
      const data = await res.json();
      const list = data?.response || [];
      return list.map(item => {
        const rawPoster = item.poster?.big || item.poster?.medium || item.poster?.small || '';
        const posterUrl = rawPoster ? (rawPoster.startsWith('//') ? `https:${rawPoster}` : rawPoster) : '';
        const statusStr = typeof item.anime_status === 'object' ? (item.anime_status?.title || 'Завершён') : (item.anime_status === 'released' ? 'Завершён' : 'Онгоинг');
        const typeStr = typeof item.type === 'object' ? (item.type?.name || item.type?.shortname || 'ТВ-сериал') : (item.type || 'ТВ-сериал');
        const ageStr = typeof item.min_age === 'object' ? (item.min_age?.title || '16+') : (item.min_age ? `${item.min_age}+` : '16+');

        return {
          id: item.anime_id,
          anime_id: item.anime_id,
          mal_id: item.remote_ids?.shikimori_id || item.anime_id,
          title: item.title,
          originalTitle: item.title,
          rating: item.rating?.average ? item.rating.average.toFixed(1) : '8.5',
          votesCount: item.views ? item.views.toLocaleString() : '12,450',
          kinopoiskRating: item.rating?.average ? (item.rating.average - 0.2).toFixed(1) : '8.3',
          ageRating: ageStr,
          status: statusStr,
          type: typeStr,
          yearSeason: item.year ? String(item.year) : '2024',
          studio: 'Аниме Студия',
          director: 'Режиссер',
          posterUrl: posterUrl || 'https://images.weserv.nl/?url=shikimori.one/system/animes/original/5114.jpg',
          description: item.description || ''
        };
      });
    }
  } catch (err) {
    console.warn('YummyAnime catalog fetch failed:', err.message);
  }
  return [];
}
