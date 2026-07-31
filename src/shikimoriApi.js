// Shikimori API Integration Service with Weserv CDN Proxy and Multi-Tier Fast Fallback
const SHIKIMORI_BASE = 'https://shikimori.one';
const WESERV_PROXY = 'https://images.weserv.nl/?url=';

const FALLBACK_SHIKIMORI_CATALOG = [
  {
    id: 5114,
    title: 'Стальной алхимик: Братство',
    originalTitle: 'Fullmetal Alchemist: Brotherhood',
    rating: '9.1',
    votesCount: '154,230',
    kinopoiskRating: '8.8',
    ageRating: '16+',
    status: 'Завершён',
    type: 'ТВ-сериал (64 эп.)',
    yearSeason: '2009',
    studio: 'Bones',
    director: 'Ясухиро Ириэ',
    posterUrl: 'https://images.weserv.nl/?url=shikimori.one/system/animes/original/5114.jpg',
    description: 'Братья Эдвард и Альфонс Элрики в попытке воскресить свою умершую мать...',
    screenshots: [
      'https://images.weserv.nl/?url=shikimori.one/system/animes/original/5114.jpg',
      'https://images.weserv.nl/?url=shikimori.one/system/animes/original/5114.jpg'
    ]
  },
  {
    id: 52034,
    title: 'Магическая Битва 2',
    originalTitle: 'Jujutsu Kaisen Season 2',
    rating: '9.5',
    votesCount: '32,140',
    kinopoiskRating: '8.9',
    ageRating: '16+',
    status: 'Завершён',
    type: 'ТВ-сериал (23 эп.)',
    yearSeason: '2023',
    studio: 'MAPPA',
    director: 'Сёта Госёдзоно',
    posterUrl: 'https://images.weserv.nl/?url=shikimori.one/system/animes/original/52034.jpg',
    description: 'Инцидент в Сибуе: величайшее противостояние магов и проклятий.'
  },
  {
    id: 49596,
    title: 'Клинок, рассекающий демонов: Тренировка Столпов',
    originalTitle: 'Kimetsu no Yaiba: Hashira Geiko-hen',
    rating: '9.6',
    votesCount: '54,100',
    kinopoiskRating: '9.0',
    ageRating: '16+',
    status: 'Онгоинг',
    type: 'ТВ-сериал',
    yearSeason: '2024',
    studio: 'ufotable',
    director: 'Харуо Сотодзаки',
    posterUrl: 'https://images.weserv.nl/?url=shikimori.one/system/animes/original/49596.jpg',
    description: 'Подготовка истребителей к решительному бою с Мудзаном.'
  },
  {
    id: 44511,
    title: 'Человек-бензопила',
    originalTitle: 'Chainsaw Man',
    rating: '9.1',
    votesCount: '28,900',
    kinopoiskRating: '8.6',
    ageRating: '18+',
    status: 'Завершён',
    type: 'ТВ-сериал (12 эп.)',
    yearSeason: '2022',
    studio: 'MAPPA',
    director: 'Рю Накаяма',
    posterUrl: 'https://images.weserv.nl/?url=shikimori.one/system/animes/original/44511.jpg',
    description: 'Дэндзи заключил контракт с демоном Почитой.'
  }
];

// Helper for fetching with a timeout
async function fetchWithTimeout(url, options = {}, timeoutMs = 2000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// Master toggle switch: false = instant local fallback mode (no network requests), true = live Shikimori API requests
export const USE_SHIKIMORI_API = false;

export async function fetchShikimoriAnimeList({ order = 'popularity', limit = 20, page = 1, search = '', kind = '' } = {}) {
  if (!USE_SHIKIMORI_API) {
    try {
      const { fetchYummyAnimeList } = await import('./yummyApi.js');
      const yummyList = await fetchYummyAnimeList({ page, search });
      if (yummyList && yummyList.length > 0) {
        return yummyList;
      }
    } catch (err) {
      console.warn('YummyAnime catalog fallback failed:', err.message);
    }
    let filtered = FALLBACK_SHIKIMORI_CATALOG;
    if (search) {
      filtered = filtered.filter(item => item.title.toLowerCase().includes(search.toLowerCase()) || item.originalTitle.toLowerCase().includes(search.toLowerCase()));
    }
    return filtered.map(item => ({ ...item, mal_id: item.id }));
  }

  // Try multi-tier proxy pipeline to prevent loading hangs
  const query = `/api/animes?limit=${limit}&page=${page}&order=${order}${search ? `&search=${encodeURIComponent(search)}` : ''}${kind ? `&kind=${kind}` : ''}`;
  const targetUrl = `${SHIKIMORI_BASE}${query}`;

  const proxies = [
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`
  ];

  for (let i = 0; i < proxies.length; i++) {
    try {
      const res = await fetchWithTimeout(proxies[i], {}, 1000);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('Data is not an array');

      console.log(`[Proxy Pipeline] Tier ${i + 1} Succeeded!`);
      return data.map(item => {
        const rawPoster = item.image?.original ? `${SHIKIMORI_BASE}${item.image.original}` : '';
        const proxiedPoster = rawPoster ? `${WESERV_PROXY}${encodeURIComponent(rawPoster.replace(/^https?:\/\//, ''))}` : '';
        return {
          id: item.id,
          mal_id: item.myanimelist_id || item.id,
          title: item.russian || item.name,
          originalTitle: item.name,
          score: item.score || '8.5',
          rating: item.score || '8.5',
          votesCount: (Math.floor(Math.random() * 20000) + 5000).toLocaleString(),
          kinopoiskRating: (parseFloat(item.score || 8.5) - 0.3).toFixed(1),
          ageRating: item.rating ? item.rating.toUpperCase() : '16+',
          status: item.status === 'released' ? 'Завершён' : item.status === 'ongoing' ? 'Онгоинг' : 'Анонс',
          type: item.kind ? item.kind.toUpperCase() : 'TV',
          yearSeason: item.aired_on ? item.aired_on.slice(0, 4) : '2024',
          studio: 'Аниме Студия',
          director: 'Режиссер',
          posterUrl: proxiedPoster || 'https://images.weserv.nl/?url=shikimori.one/system/animes/original/5114.jpg',
          description: item.description || 'Описание аниме тайтла'
        };
      });
    } catch (err) {
      console.warn(`[Proxy Pipeline] Tier ${i + 1} failed:`, err.message);
    }
  }

  // Final fallback to offline catalog if all proxies are blocked/slow
  console.log('[Proxy Pipeline] All API proxies failed/timed out. Using offline fallback catalog.');
  let filtered = FALLBACK_SHIKIMORI_CATALOG;
  if (search) {
    filtered = filtered.filter(item => item.title.toLowerCase().includes(search.toLowerCase()) || item.originalTitle.toLowerCase().includes(search.toLowerCase()));
  }
  return filtered.map(item => ({ ...item, mal_id: item.id }));
}

export async function fetchShikimoriAnimeDetails(id) {
  if (!USE_SHIKIMORI_API) {
    try {
      const { fetchYummyAnimeDetails } = await import('./yummyApi.js');
      const yummyData = await fetchYummyAnimeDetails(id, false);
      if (yummyData) {
        const rawPoster = yummyData.poster?.big || yummyData.poster?.medium || yummyData.poster?.small || '';
        const posterUrl = rawPoster ? (rawPoster.startsWith('//') ? `https:${rawPoster}` : rawPoster) : '';
        return {
          id: yummyData.anime_id,
          mal_id: yummyData.remote_ids?.shikimori_id || yummyData.anime_id,
          title: yummyData.title,
          originalTitle: yummyData.title,
          rating: yummyData.rating?.average ? yummyData.rating.average.toFixed(1) : '8.5',
          votesCount: yummyData.views ? yummyData.views.toLocaleString() : '12,450',
          kinopoiskRating: yummyData.rating?.average ? (yummyData.rating.average - 0.2).toFixed(1) : '8.3',
          ageRating: yummyData.min_age ? `${yummyData.min_age}+` : '16+',
          status: yummyData.anime_status === 'released' ? 'Завершён' : 'Онгоинг',
          type: yummyData.type || 'ТВ-сериал',
          yearSeason: yummyData.year ? String(yummyData.year) : '2024',
          studio: 'Аниме Студия',
          director: 'Режиссер',
          posterUrl: posterUrl || 'https://images.weserv.nl/?url=shikimori.one/system/animes/original/5114.jpg',
          description: yummyData.description || '',
          screenshots: []
        };
      }
    } catch (err) {
      console.warn('YummyAnime details fallback failed:', err.message);
    }
    const item = FALLBACK_SHIKIMORI_CATALOG.find(i => i.id === id) || FALLBACK_SHIKIMORI_CATALOG[0];
    return { ...item, mal_id: item.id, screenshots: item.screenshots || [] };
  }

  const targetUrl = `${SHIKIMORI_BASE}/api/animes/${id}`;
  const proxies = [
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`
  ];

  for (let i = 0; i < proxies.length; i++) {
    try {
      const res = await fetchWithTimeout(proxies[i], {}, 2000);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const item = await res.json();

      const rawPoster = item.image?.original ? `${SHIKIMORI_BASE}${item.image.original}` : '';
      const proxiedPoster = rawPoster ? `${WESERV_PROXY}${encodeURIComponent(rawPoster.replace(/^https?:\/\//, ''))}` : '';

      return {
        id: item.id,
        mal_id: item.myanimelist_id || item.id,
        title: item.russian || item.name,
        originalTitle: item.name,
        rating: item.score || '8.5',
        votesCount: item.rates_scores_stats ? item.rates_scores_stats.reduce((acc, curr) => acc + curr.value, 0).toLocaleString() : '12,450',
        kinopoiskRating: (parseFloat(item.score || 8.5) - 0.2).toFixed(1),
        ageRating: item.rating ? item.rating.toUpperCase() : '16+',
        status: item.status === 'released' ? 'Завершён' : item.status === 'ongoing' ? 'Онгоинг' : 'Анонсирован',
        type: item.kind ? `${item.kind.toUpperCase()} (${item.episodes || '?'} эп.)` : 'ТВ-сериал',
        yearSeason: item.aired_on ? item.aired_on.slice(0, 4) : '2024',
        studio: item.studios && item.studios.length > 0 ? item.studios[0].name : 'Аниме Студия',
        director: 'Известный Режиссер',
        posterUrl: proxiedPoster || 'https://images.weserv.nl/?url=shikimori.one/system/animes/original/5114.jpg',
        description: item.description ? item.description.replace(/\[\/?\w+\]/g, '') : 'Описание отсутствует.',
        screenshots: await fetchShikimoriScreenshots(id)
      };
    } catch (err) {
      console.warn(`[Proxy Pipeline] Detail fetch Tier ${i + 1} failed:`, err.message);
    }
  }

  const item = FALLBACK_SHIKIMORI_CATALOG.find(i => i.id === id) || FALLBACK_SHIKIMORI_CATALOG[0];
  return { ...item, mal_id: item.id, screenshots: item.screenshots || [] };
}

export async function fetchShikimoriScreenshots(id) {
  try {
    const { ipcFetch } = await import('./yummyApi.js');
    const targetUrl = `${SHIKIMORI_BASE}/api/animes/${id}/screenshots`;
    const res = await ipcFetch(targetUrl);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map(s => `${SHIKIMORI_BASE}${s.original}`);
      }
    }
  } catch (err) {
    console.warn('Failed to fetch screenshots:', err.message);
  }
  return [];
}
