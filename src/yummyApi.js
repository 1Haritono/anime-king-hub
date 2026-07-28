// YummyAnime API Integration Service (api.yani.tv)
const YUMMY_BASE = 'https://api.yani.tv';
const CORS_PROXY = 'https://corsproxy.io/?';

const YUMMY_APP_TOKEN = import.meta.env.VITE_YUMMY_APP_TOKEN || 'kxqtm49l68hc7f8tb5b1ubaz0hfj4mg9';

export async function fetchYummyAnimeDetails(animeId, needVideos = true) {
  try {
    const targetUrl = `${YUMMY_BASE}/anime/${animeId}${needVideos ? '?need_videos=true' : ''}`;
    const res = await fetch(`${CORS_PROXY}${encodeURIComponent(targetUrl)}`, {
      headers: {
        'Accept': 'application/json',
        'X-User-Token': YUMMY_APP_TOKEN
      }
    });

    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.response || null;
  } catch (err) {
    console.warn('YummyAnime API request failed:', err.message);
    return null;
  }
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
      playerName: item.data?.player || 'Плеер',
      dubbing: item.data?.dubbing || 'Оригинал / Озвучка',
      playerId: item.data?.player_id,
      iframeUrl: iframeUrl,
      skips: item.skips || { opening: null, ending: null }
    };
  });
}
