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
  
  // Browser fallback (will likely fail CORS for protected endpoints, expected in Electron app)
  return fetch(url, options);
}

export async function fetchYummyAnimeDetails(animeId, needVideos = true) {
  const targetUrl = `${YUMMY_BASE}/anime/${animeId}${needVideos ? '?need_videos=true' : ''}`;
  
  try {
    const fetchPromise = ipcFetch(targetUrl, {
      headers: {
        'Accept': 'application/json',
        'X-User-Token': YUMMY_APP_TOKEN
      }
    });

    // 8-second timeout to prevent infinite loading (BUG-18/safetyTimer follow-up)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('YummyAnime API timeout exceeded (8000ms)')), 8000)
    );

    const res = await Promise.race([fetchPromise, timeoutPromise]);

    if (res.ok) {
      const data = await res.json();
      if (data && data.response) return data.response;
    }
  } catch (err) {
    console.warn('YummyAnime API fetch failed:', err.message);
  }

  return null;
}

export function parseYummyVideos(videosArray = []) {
  return videosArray.map(item => {
    let iframeUrl = item.iframe_url || '';
    if (iframeUrl.startsWith('//')) {
      iframeUrl = `https:${iframeUrl}`;
    }
    return {
      videoId: item.video_id,
      episodeNumber: item.number || '1',
      playerName: item.data?.player || 'Основной Плеер',
      dubbing: item.data?.dubbing || 'Оригинал / Озвучка',
      playerId: item.data?.player_id,
      iframeUrl: iframeUrl,
      skips: item.skips || { opening: null, ending: null }
    };
  });
}
