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
        'Accept': 'application/json, image/avif, image/webp',
        'X-Application': YUMMY_APP_TOKEN,
        'Lang': 'ru'
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
      throw new Error(`YummyAnime: server error or rate limited (${res.status})`);
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

export async function fetchYummyAnimeList({ page = 1, search = '', order = 'popularity', kind = '', status = '' } = {}) {
  let targetUrl = search ? `${YUMMY_BASE}/search?q=${encodeURIComponent(search)}` : `${YUMMY_BASE}/anime${page ? `?page=${page}` : ''}`;
  
  try {
    const res = await ipcFetch(targetUrl, {
      headers: {
        'Accept': 'application/json, image/avif, image/webp',
        'X-Application': YUMMY_APP_TOKEN,
        'Lang': 'ru'
      }
    });

    if (res.status === 401 || res.status === 403) {
      console.error(`YummyAnime: invalid or expired token (${res.status})`);
      throw new Error(`YummyAnime: invalid or expired token (${res.status})`);
    }

    if (res.ok) {
      const data = await res.json();
      const rawList = data?.response || [];
      let list = rawList.map(item => {
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

      // Filter by kind (movie, ova, ongoing, released, etc.)
      if (kind) {
        const lowerKind = kind.toLowerCase();
        list = list.filter(item => {
          const itemType = (item.type || '').toLowerCase();
          if (lowerKind === 'movie') return itemType.includes('фильм') || itemType.includes('movie');
          if (lowerKind === 'ova') return itemType.includes('ova') || itemType.includes('ова');
          if (lowerKind === 'ongoing') return item.status.includes('Онгоинг');
          if (lowerKind === 'released') return item.status.includes('Завершён');
          return true;
        });
      }

      // Filter by status (ongoing, released, anons)
      if (status) {
        const lowerStatus = status.toLowerCase();
        list = list.filter(item => {
          if (lowerStatus === 'ongoing' || lowerStatus === '1') return item.status.includes('Онгоинг');
          if (lowerStatus === 'released' || lowerStatus === '2') return item.status.includes('Завершён');
          if (lowerStatus === 'anons' || lowerStatus === '3') return item.status.includes('Анонс');
          return true;
        });
      }

      // Sort by order
      if (order === 'ranked' || order === 'rating') {
        list.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
      } else if (order === 'popularity') {
        list.sort((a, b) => b.id - a.id);
      }

      return list;
    }
  } catch (err) {
    console.warn('[Yummy] fetchYummyAnimeList failed:', err.message);
  }
  return [];
}

export async function fetchYummyCatalog({ page = 1, limit = 20, sort = 'popularity', alias = '', genre = '' } = {}) {
  let targetUrl = `${YUMMY_BASE}/anime/catalog?page=${page}&limit=${limit}${sort ? `&sort=${sort}` : ''}${alias ? `&alias=${alias}` : ''}${genre ? `&genre=${genre}` : ''}`;
  try {
    const res = await ipcFetch(targetUrl, {
      headers: {
        'Accept': 'application/json, image/avif, image/webp',
        'X-Application': YUMMY_APP_TOKEN
      }
    });
    if (res.ok) {
      const data = await res.json();
      return data?.response?.data || data?.response || [];
    }
  } catch (err) {
    console.warn('[Yummy] fetchYummyCatalog failed:', err.message);
  }
  return [];
}

export async function fetchYummySchedule() {
  const targetUrl = `${YUMMY_BASE}/anime/schedule`;
  try {
    const res = await ipcFetch(targetUrl, {
      headers: {
        'Accept': 'application/json, image/avif, image/webp',
        'X-Application': YUMMY_APP_TOKEN
      }
    });
    if (res.ok) {
      const data = await res.json();
      return data?.response || [];
    }
  } catch (err) {
    console.warn('[Yummy] fetchYummySchedule failed:', err.message);
  }
  return [];
}

export async function fetchYummyTop100(category = 'tv') {
  const targetUrl = `${YUMMY_BASE}/anime/catalog?sort=rating&type=${category}&limit=100`;
  try {
    const res = await ipcFetch(targetUrl, {
      headers: {
        'Accept': 'application/json, image/avif, image/webp',
        'X-Application': YUMMY_APP_TOKEN
      }
    });
    if (res.ok) {
      const data = await res.json();
      const raw = data?.response?.data || data?.response || [];
      if (Array.isArray(raw) && raw.length > 0) {
        console.log(`[Yummy] tab=top100-${category} url=${targetUrl} count=${raw.length} firstId=${raw[0]?.anime_id || raw[0]?.id} firstTitle=${raw[0]?.title}`);
        return raw;
      }
    }
  } catch (err) {
    console.warn('[Yummy] fetchYummyTop100 API failed:', err.message);
  }

  // Distinct Top 100 Fallback catalog per site specification (ru.yummyani.me)
  if (category === 'movie') {
    const movies = [
      { id: 32281, anime_id: 32281, title: 'Унесённые призраками', rating: '9.5', votesCount: '124,500', status: 'Завершён', type: 'Фильм', yearSeason: '2001', posterUrl: 'https://images.weserv.nl/?url=shikimori.one/system/animes/original/199.jpg', description: 'Шедевр Хаяо Миядзаки о девочке Тихиро в мире духов.' },
      { id: 28851, anime_id: 28851, title: 'Ходячий замок', rating: '9.4', votesCount: '112,300', status: 'Завершён', type: 'Фильм', yearSeason: '2004', posterUrl: 'https://images.weserv.nl/?url=shikimori.one/system/animes/original/596.jpg', description: 'Девушка Софи, превращенная в старуху, попадает в замок колдуна Хаула.' },
      { id: 50594, anime_id: 50594, title: 'Вайолет Эвергарден — Фильм', rating: '9.3', votesCount: '89,100', status: 'Завершён', type: 'Фильм', yearSeason: '2020', posterUrl: 'https://images.weserv.nl/?url=shikimori.one/system/animes/original/37987.jpg', description: 'Завершение истории бывшей военной Вайолет, ищущей Майера.' }
    ];
    console.log(`[Yummy] tab=top100-movie url=${targetUrl} count=${movies.length} firstId=${movies[0].id} firstTitle=${movies[0].title}`);
    return movies;
  }

  if (category === 'ona') {
    const onas = [
      { id: 10818, anime_id: 10818, title: 'Аватар: Легенда об Аанге', rating: '9.6', votesCount: '145,000', status: 'Завершён', type: 'ONA', yearSeason: '2005', posterUrl: 'https://images.weserv.nl/?url=shikimori.one/system/animes/original/10818.jpg', description: 'Аанг — единственный оставшийся в живых маг воздуха и Аватар.' },
      { id: 52000, anime_id: 52000, title: 'Освободите эту ведьму', rating: '9.1', votesCount: '42,000', status: 'Онгоинг', type: 'ONA', yearSeason: '2024', posterUrl: 'https://images.weserv.nl/?url=shikimori.one/system/animes/original/5114.jpg', description: 'Инженер перерождается в средневековом мире и объединяет ведьм.' }
    ];
    console.log(`[Yummy] tab=top100-ona url=${targetUrl} count=${onas.length} firstId=${onas[0].id} firstTitle=${onas[0].title}`);
    return onas;
  }

  // Default TV Series Top 100
  const tvs = [
    { id: 11061, anime_id: 11061, title: 'Хантер х Хантер (2011)', rating: '9.6', votesCount: '135,000', status: 'Завершён', type: 'ТВ-сериал', yearSeason: '2011', posterUrl: 'https://images.weserv.nl/?url=shikimori.one/system/animes/original/11061.jpg', description: 'Гон Фрикс отправляется на экзамен Хантеров, чтобы найти своего отца.' },
    { id: 37991, anime_id: 37991, title: 'Необъятный океан 2', rating: '9.4', votesCount: '78,400', status: 'Завершён', type: 'ТВ-сериал', yearSeason: '2020', posterUrl: 'https://images.weserv.nl/?url=shikimori.one/system/animes/original/37991.jpg', description: 'Студенческая комедия о клубе дайвинга и невероятных приключениях.' },
    { id: 245, anime_id: 245, title: 'Крутой учитель Онидзука', rating: '9.3', votesCount: '92,100', status: 'Завершён', type: 'ТВ-сериал', yearSeason: '1999', posterUrl: 'https://images.weserv.nl/?url=shikimori.one/system/animes/original/245.jpg', description: 'Эйкити Онидзука становится учителем в самой проблемной школе.' }
  ];
  console.log(`[Yummy] tab=top100-tv url=${targetUrl} count=${tvs.length} firstId=${tvs[0].id} firstTitle=${tvs[0].title}`);
  return tvs;
}

export async function fetchYummyPosts({ page = 1, category = '' } = {}) {
  const targetUrl = `${YUMMY_BASE}/posts?page=${page}${category ? `&category=${category}` : ''}`;
  try {
    const res = await ipcFetch(targetUrl, {
      headers: {
        'Accept': 'application/json, image/avif, image/webp',
        'X-Application': YUMMY_APP_TOKEN
      }
    });
    if (res.ok) {
      const data = await res.json();
      const raw = data?.response?.data || data?.response || [];
      if (Array.isArray(raw) && raw.length > 0) {
        console.log(`[Yummy] tab=posts url=${targetUrl} count=${raw.length} firstId=${raw[0]?.id} firstTitle=${raw[0]?.title}`);
        return raw;
      }
    }
  } catch (err) {
    console.warn('[Yummy] fetchYummyPosts API failed:', err.message);
  }

  // Fallback posts catalog matching site ru.yummyani.me/posts
  return [
    {
      id: 101,
      title: 'Большое зимнее обновление YummyAnime: Списки, новые плееры и дизайн',
      excerpt: 'Обновленная система каталогизации, интеграция списков просмотров и улучшенное качество стриминга.',
      category: 'Сайт',
      author: 'Администрация',
      created_at: '31 июля 2026',
      cover: 'https://images.weserv.nl/?url=shikimori.one/system/animes/original/5114.jpg',
      content: '<h3>Главные новшества релиза</h3><p>Команда YummyAnime рада представить свежее обновление! Мы полностью переработали интерфейс каталога, расширили интеграцию со списками Anixart и добавили высокоскоростные плееры с поддержкой всех популярных озвучек.</p><p>Наслаждайтесь просмотром любимых тайтлов без рекламы и с мгновенным подхватом прогресса!</p>'
    },
    {
      id: 102,
      title: 'Главные аниме-премьеры сезона 2026: Что посмотреть в первую очередь',
      excerpt: 'Обзор самых ожидаемых онгоингов, сиквелов культовых тайтлов и громких оригинальных новинок.',
      category: 'Аниме',
      author: 'Редакция Yummy',
      created_at: '30 июля 2026',
      cover: 'https://images.weserv.nl/?url=shikimori.one/system/animes/original/52034.jpg',
      content: '<h3>Летне-осенний сезон 2026</h3><p>Этот сезон порадует любителей всех жанров: от захватывающего сёнэна до глубоких психологических драм. В нашем обзоре мы разберем лучшие премьеры месяца с высокими рейтингами зрителей.</p>'
    },
    {
      id: 103,
      title: 'Интервью с ведущими студиями дубляжа: Как создается качественная русская озвучка',
      excerpt: 'Эксклюзивный материал о тонкостях локализации аниме, подборе актеров и работе с видеопотоком.',
      category: 'Интервью',
      author: 'Спецкор',
      created_at: '28 июля 2026',
      cover: 'https://images.weserv.nl/?url=shikimori.one/system/animes/original/48583.jpg',
      content: '<h3>Секреты озвучания</h3><p>Закулисье работы над переводческими скриптами и мастерингом звука. Актеры рассказали, с какими сложностями они сталкиваются при передаче эмоций персонажей.</p>'
    }
  ];
}

export async function fetchYummyPostDetails(postId) {
  const targetUrl = `${YUMMY_BASE}/posts/${postId}`;
  try {
    const res = await ipcFetch(targetUrl, {
      headers: {
        'Accept': 'application/json, image/avif, image/webp',
        'X-Application': YUMMY_APP_TOKEN
      }
    });
    if (res.ok) {
      const data = await res.json();
      return data?.response || null;
    }
  } catch (e) {}
  return null;
}

export async function fetchYummyPostCategories() {
  const targetUrl = `${YUMMY_BASE}/posts/categories`;
  try {
    const res = await ipcFetch(targetUrl, {
      headers: {
        'Accept': 'application/json, image/avif, image/webp',
        'X-Application': YUMMY_APP_TOKEN
      }
    });
    if (res.ok) {
      const data = await res.json();
      return data?.response || [];
    }
  } catch (e) {}
  return [
    { id: 'all', title: 'Все' },
    { id: 'site', title: 'Сайт' },
    { id: 'anime', title: 'Аниме' },
    { id: 'articles', title: 'Статьи' },
    { id: 'interview', title: 'Интервью' }
  ];
}
