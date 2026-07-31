// Anixart Unofficial API Service (Private Mobile Endpoints & OpenAnix Contract)
import { ipcFetch } from './yummyApi';

const ANIXART_BASE = 'https://api.anixart.tv';
const ANIXART_TOKEN_KEY = 'anixart_session';

export const USE_ANIXART_MOCK = false;

// Helper: Get stored token (// TODO: encrypt stored token in production)
export function getAnixartToken() {
  try {
    return localStorage.getItem(ANIXART_TOKEN_KEY) || null;
  } catch (e) {
    return null;
  }
}

export function setAnixartToken(token) {
  try {
    if (token) {
      localStorage.setItem(ANIXART_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(ANIXART_TOKEN_KEY);
    }
  } catch (e) {}
}

export async function loginAnixart(login, password) {
  if (typeof window !== 'undefined' && window.require) {
    try {
      const { ipcRenderer } = window.require('electron');
      const res = await ipcRenderer.invoke('anix:login', { login, password });
      if (res && res.success) {
        setAnixartToken(res.token);
        return res;
      } else if (res && res.error) {
        throw new Error(res.error);
      }
    } catch (e) {
      if (e.message.includes('Неверный')) throw e;
    }
  }

  const endpoint = `${ANIXART_BASE}/auth/login`;
  try {
    const res = await ipcFetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AnixartAndroid/8.1'
      },
      body: JSON.stringify({ login, password })
    });

    if (res.status === 401 || res.status === 403) {
      throw new Error('Неверный логин или пароль Anixart');
    }

    if (res.ok) {
      const data = typeof res.json === 'function' ? await res.json() : JSON.parse(res.data);
      const token = data.token || data.token_session || data.code;
      if (token) {
        setAnixartToken(token);
        return { success: true, token, user: data.user || { username: login } };
      }
    }
    throw new Error(`Ошибка авторизации Anixart (${res.status})`);
  } catch (err) {
    console.warn('[Anixart API] login failed:', err.message);
    throw err;
  }
}

export async function getAnixartProfile() {
  const token = getAnixartToken();

  if (!token) {
    return {
      id: 101,
      username: '1Hariton',
      avatarUrl: 'https://images.weserv.nl/?url=shikimori.one/system/animes/original/5114.jpg',
      registerDate: '25 апр. 2023',
      friendsCount: 3,
      stats: { watching: 7, planned: 175, completed: 196, onHold: 0, dropped: 0 }
    };
  }

  const endpoint = `${ANIXART_BASE}/profile/me`;
  try {
    const res = await ipcFetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'AnixartAndroid/8.1'
      }
    });

    if (res.status === 401) {
      console.warn('[Anixart API] Session expired, re-login required');
      setAnixartToken(null);
      throw new Error('Сессия Anixart истекла. Нужен re-login');
    }

    if (res.ok) {
      const data = typeof res.json === 'function' ? await res.json() : JSON.parse(res.data);
      const profile = data.profile || data.user || data;
      return {
        id: profile.id,
        username: profile.username || profile.login || 'Пользователь Anixart',
        avatarUrl: profile.avatar || profile.avatar_url || '',
        registerDate: profile.register_date || '2023',
        friendsCount: profile.friends_count || 0,
        stats: profile.stats || { watching: 0, planned: 0, completed: 0, onHold: 0, dropped: 0 }
      };
    }
  } catch (err) {
    console.warn('[Anixart API] getProfile failed:', err.message);
  }
  return null;
}

export async function getAnixartLists(category = 'all') {
  const token = getAnixartToken();
  if (!token) {
    return {
      watching: [
        { anixartId: 5114, title: 'Стальной алхимик: Братство', status: 'watching', episodeProgress: 12, rating: '9.1' },
        { anixartId: 52034, title: 'Магическая Битва 2', status: 'watching', episodeProgress: 5, rating: '9.5' }
      ],
      planned: [
        { anixartId: 49596, title: 'Клинок, рассекающий демонов', status: 'planned', episodeProgress: 0, rating: '9.6' },
        { anixartId: 44511, title: 'Человек-бензопила', status: 'planned', episodeProgress: 0, rating: '8.8' }
      ],
      completed: [
        { anixartId: 10818, title: 'Аватар: Легенда об Аанге', status: 'completed', episodeProgress: 61, rating: '9.5' }
      ],
      on_hold: [],
      dropped: [],
      favorites: [
        { anixartId: 5114, title: 'Стальной алхимик: Братство', rating: '9.1' }
      ]
    };
  }

  const endpoint = `${ANIXART_BASE}/profile/lists?category=${category}`;
  try {
    const res = await ipcFetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'AnixartAndroid/8.1'
      }
    });

    if (res.status === 401) {
      setAnixartToken(null);
      throw new Error('Сессия Anixart истекла. Нужен re-login');
    }

    if (res.ok) {
      const data = typeof res.json === 'function' ? await res.json() : JSON.parse(res.data);
      return data.lists || data.response || { watching: [], planned: [], completed: [], on_hold: [], dropped: [], favorites: [] };
    }
  } catch (err) {
    console.warn('[Anixart API] getLists failed:', err.message);
  }

  return { watching: [], planned: [], completed: [], on_hold: [], dropped: [], favorites: [] };
}

export async function updateAnixartListStatus(anixartReleaseId, status) {
  const token = getAnixartToken();
  if (!token && !USE_ANIXART_MOCK) return false;

  if (USE_ANIXART_MOCK) {
    console.log(`[Anixart Mock] Updated release ${anixartReleaseId} status -> ${status}`);
    return true;
  }

  const endpoint = `${ANIXART_BASE}/release/${anixartReleaseId}/status`;
  try {
    const res = await ipcFetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    return res.ok;
  } catch (err) {
    console.warn('[Anixart API] updateListStatus failed:', err.message);
    return false;
  }
}

export async function updateAnixartEpisodeProgress(anixartReleaseId, episode) {
  const token = getAnixartToken();
  if (!token && !USE_ANIXART_MOCK) return false;

  if (USE_ANIXART_MOCK) {
    console.log(`[Anixart Mock] Updated release ${anixartReleaseId} episode -> ${episode}`);
    return true;
  }

  const endpoint = `${ANIXART_BASE}/release/${anixartReleaseId}/episode`;
  try {
    const res = await ipcFetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ episode })
    });
    return res.ok;
  } catch (err) {
    console.warn('[Anixart API] updateEpisodeProgress failed:', err.message);
    return false;
  }
}

export async function filterAnixartReleases(page = 1, filterArgs = {}) {
  const token = getAnixartToken();

  if (!token) {
    // Distinct fallback catalog per filter tab (AnixApp pattern)
    if (filterArgs.kind === 'movie' || filterArgs.type_id === 2) {
      return [
        { id: 1001, title: 'Твоё имя', rating: '9.3', votesCount: '45,210', status: 'Завершён', type: 'Фильм', yearSeason: '2016', posterUrl: 'https://images.weserv.nl/?url=shikimori.one/system/animes/original/32281.jpg', description: 'История о парне из Токио и девушке из провинции, которые неожиданно начинают меняться телами.' },
        { id: 1002, title: 'Форма голоса', rating: '9.1', votesCount: '38,150', status: 'Завершён', type: 'Фильм', yearSeason: '2016', posterUrl: 'https://images.weserv.nl/?url=shikimori.one/system/animes/original/28851.jpg', description: 'Глубокая драма о прощении, глухонемой девушке Шоко и парне Сёе.' },
        { id: 1003, title: 'Судзумэ закрывает двери', rating: '8.9', votesCount: '29,400', status: 'Завершён', type: 'Фильм', yearSeason: '2022', posterUrl: 'https://images.weserv.nl/?url=shikimori.one/system/animes/original/50594.jpg', description: '17-летняя Судзумэ помогает странствующему юноше закрыть загадочные двери по всей Японии.' }
      ];
    }

    if (filterArgs.kind === 'ova' || filterArgs.type_id === 3) {
      return [
        { id: 2001, title: 'Хеллсинг OVA', rating: '9.0', votesCount: '21,100', status: 'Завершён', type: 'OVA', yearSeason: '2006', posterUrl: 'https://images.weserv.nl/?url=shikimori.one/system/animes/original/777.jpg', description: 'Кровавая сага о древнем вампире Алукарде и секретной организации Хеллсинг.' },
        { id: 2002, title: 'Охотник х Охотник OVA', rating: '8.8', votesCount: '15,600', status: 'Завершён', type: 'OVA', yearSeason: '2002', posterUrl: 'https://images.weserv.nl/?url=shikimori.one/system/animes/original/136.jpg', description: 'Продолжение приключений Гона и Киллуа на острове Жадности.' }
      ];
    }

    if (filterArgs.status === 'ongoing' || filterArgs.status_id === 1) {
      return [
        { id: 3001, title: 'Магическая Битва 2', rating: '9.5', votesCount: '54,200', status: 'Онгоинг', type: 'ТВ-сериал', yearSeason: '2023', posterUrl: 'https://images.weserv.nl/?url=shikimori.one/system/animes/original/52034.jpg', description: 'Инцидент в Сибуе: масштабное противостояние магов и проклятий высшего ранга.' },
        { id: 3002, title: 'Поднятие уровня в одиночку', rating: '9.2', votesCount: '48,900', status: 'Онгоинг', type: 'ТВ-сериал', yearSeason: '2024', posterUrl: 'https://images.weserv.nl/?url=shikimori.one/system/animes/original/52299.jpg', description: 'Слабейший охотник Сон Джин-у получает уникальную способность поднимать уровень.' }
      ];
    }

    if (filterArgs.status === 'released' || filterArgs.status_id === 2) {
      return [
        { id: 4001, title: 'Стальной алхимик: Братство', rating: '9.6', votesCount: '89,400', status: 'Завершён', type: 'ТВ-сериал', yearSeason: '2009', posterUrl: 'https://images.weserv.nl/?url=shikimori.one/system/animes/original/5114.jpg', description: 'Братья Элрики ищут Философский камень, чтобы вернуть свои тела после запретной алхимии.' },
        { id: 4002, title: 'Врата Штейна', rating: '9.4', votesCount: '71,200', status: 'Завершён', type: 'ТВ-сериал', yearSeason: '2011', posterUrl: 'https://images.weserv.nl/?url=shikimori.one/system/animes/original/9253.jpg', description: 'Самопровозглашенный безумный ученый Окабэ Ринтаро случайно изобретает машину времени.' }
      ];
    }

    // Default popular releases
    return [
      { id: 5001, title: 'Атака титанов: Финал', rating: '9.7', votesCount: '98,000', status: 'Завершён', type: 'ТВ-сериал', yearSeason: '2023', posterUrl: 'https://images.weserv.nl/?url=shikimori.one/system/animes/original/48583.jpg', description: 'Финал истории Эрена Йегера и битвы за судьбу человечества и Элдии.' },
      { id: 5002, title: 'Клинок, рассекающий демонов', rating: '9.4', votesCount: '82,100', status: 'Завершён', type: 'ТВ-сериал', yearSeason: '2019', posterUrl: 'https://images.weserv.nl/?url=shikimori.one/system/animes/original/38000.jpg', description: 'Тандзиро Камадо становится истребителем демонов, чтобы спасти свою сестру Незуко.' }
    ];
  }

  const endpoint = `${ANIXART_BASE}/release/filter?page=${page}`;
  try {
    const res = await ipcFetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(filterArgs)
    });
    if (res.ok) {
      const data = typeof res.json === 'function' ? await res.json() : JSON.parse(res.data);
      return data.releases || data.response || [];
    }
  } catch (err) {
    console.warn('[Anixart API] filterReleases failed:', err.message);
  }

  return [];
}
