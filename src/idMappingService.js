// ID Mapping Service: Anixart release ID ↔ Yummy anime_id resolution with caching
import { fetchYummyAnimeList } from './yummyApi';

const MAP_KEY = 'anixart_yummy_map';

function getMapFromStorage() {
  try {
    const raw = localStorage.getItem(MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveMapToStorage(map) {
  try {
    localStorage.setItem(MAP_KEY, JSON.stringify(map));
  } catch (e) {}
}

export async function resolveYummyId({ anixartId, title, shikimoriId, malId }) {
  if (!anixartId && !title && !shikimoriId && !malId) return null;

  const map = getMapFromStorage();
  const cacheKey = String(anixartId || shikimoriId || title);

  // 1) Check local storage cache
  if (map[cacheKey]) {
    return map[cacheKey];
  }

  const targetShikimoriId = shikimoriId || malId;

  // 2) Search Yummy by remote Shikimori ID or title
  try {
    const searchResults = await fetchYummyAnimeList({ search: title || '' });
    if (searchResults && searchResults.length > 0) {
      // Best match by shikimoriId or title
      let best = searchResults.find(item => targetShikimoriId && String(item.mal_id) === String(targetShikimoriId));
      if (!best) {
        best = searchResults[0];
      }

      const yummyId = best.id || best.anime_id;
      if (yummyId) {
        map[cacheKey] = yummyId;
        // Save reverse map as well
        map[`yummy_${yummyId}`] = anixartId || yummyId;
        saveMapToStorage(map);
        return yummyId;
      }
    }
  } catch (err) {
    console.warn('[Mapping] Failed to resolve Yummy ID:', err.message);
  }

  // Fallback to input ID
  const fallbackId = anixartId || shikimoriId || 5114;
  map[cacheKey] = fallbackId;
  saveMapToStorage(map);
  return fallbackId;
}

export function resolveAnixartId(yummyId) {
  if (!yummyId) return null;
  const map = getMapFromStorage();
  return map[`yummy_${yummyId}`] || yummyId;
}

export async function batchMapList(items = [], onProgress) {
  const map = getMapFromStorage();
  const resolvedList = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const yummyId = await resolveYummyId(item);
    resolvedList.push({
      ...item,
      yummyId,
      id: yummyId || item.anixartId || item.id
    });

    if (typeof onProgress === 'function') {
      onProgress(i + 1, items.length);
    }
  }

  saveMapToStorage(map);
  return resolvedList;
}
