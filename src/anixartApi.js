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
  if (USE_ANIXART_MOCK) {
    const mockToken = 'mock_anixart_session_token_12345';
    setAnixartToken(mockToken);
    return { success: true, token: mockToken, user: { username: login, id: 101 } };
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
  if (!token && !USE_ANIXART_MOCK) {
    return null;
  }

  if (USE_ANIXART_MOCK) {
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
  if (!token && !USE_ANIXART_MOCK) {
    return { watching: [], planned: [], completed: [], on_hold: [], dropped: [], favorites: [] };
  }

  if (USE_ANIXART_MOCK) {
    return {
      watching: [
        { anixartId: 5114, title: 'Стальной алхимик: Братство', status: 'watching', episodeProgress: 12 },
        { anixartId: 52034, title: 'Магическая Битва 2', status: 'watching', episodeProgress: 5 }
      ],
      planned: [
        { anixartId: 49596, title: 'Клинок, рассекающий демонов', status: 'planned', episodeProgress: 0 }
      ],
      completed: [],
      on_hold: [],
      dropped: [],
      favorites: []
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
