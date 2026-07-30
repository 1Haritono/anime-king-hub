// YummyAnime API Integration Service (api.yani.tv) with Proxy & Fast Timeout Fallback
const YUMMY_BASE = 'https://api.yani.tv';
const YUMMY_APP_TOKEN = import.meta.env.VITE_YUMMY_APP_TOKEN || 'kxqtm49l68hc7f8tb5b1ubaz0hfj4mg9';

export async function fetchYummyAnimeDetails(animeId, needVideos = true) {
  const targetUrl = `${YUMMY_BASE}/anime/${animeId}${needVideos ? '?need_videos=true' : ''}`;
  
  // 1. Try Direct Fetch with 1.5s timeout
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);

    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'X-User-Token': YUMMY_APP_TOKEN
      }
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (data && data.response) return data.response;
    }
  } catch (err) {
    console.warn('Direct YummyAnime API fetch bypassed:', err.message);
  }

  // 2. Try CORS Proxy Fallback with 1.5s timeout
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);

    const res = await fetch(proxyUrl, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (data && data.response) return data.response;
    }
  } catch (err) {
    console.warn('Proxy YummyAnime API fetch bypassed:', err.message);
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
