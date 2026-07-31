// List & Collections Synchronization Service (Anixart = Source of Truth)
import { getAnixartLists, updateAnixartListStatus, updateAnixartEpisodeProgress } from './anixartApi';
import { batchMapList } from './idMappingService';

export async function pullFromAnixart() {
  try {
    const lists = await getAnixartLists('all');
    
    const categories = [
      { key: 'watching', storageKey: 'collection_watching' },
      { key: 'planned', storageKey: 'collection_planned' },
      { key: 'completed', storageKey: 'collection_completed' },
      { key: 'on_hold', storageKey: 'collection_onhold' },
      { key: 'dropped', storageKey: 'collection_dropped' },
      { key: 'favorites', storageKey: 'bookmarks' }
    ];

    for (const cat of categories) {
      const rawItems = lists[cat.key] || [];
      const mappedItems = await batchMapList(rawItems.map(item => ({
        anixartId: item.anixartId || item.id,
        shikimoriId: item.shikimoriId || item.mal_id,
        title: item.title,
        status: cat.key,
        posterUrl: item.posterUrl || item.poster || '',
        episodeProgress: item.episodeProgress || item.episodes_watched || 0,
        rating: item.rating || '8.5'
      })));

      localStorage.setItem(cat.storageKey, JSON.stringify(mappedItems));
    }

    console.log('[listSyncService] Successfully pulled collections from Anixart.');
    return true;
  } catch (err) {
    console.warn('[listSyncService] pullFromAnixart failed:', err.message);
    return false;
  }
}

export async function pushStatusToAnixart(anixartId, status) {
  if (!anixartId) return false;
  return updateAnixartListStatus(anixartId, status);
}

export async function pushProgressToAnixart(anixartId, episode) {
  if (!anixartId) return false;
  return updateAnixartEpisodeProgress(anixartId, episode);
}
