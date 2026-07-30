import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Navigation & View Routing State (BUG-12)
  const [activeNav, setActiveNavState] = useState('home');
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  // Theme State
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('animeking_theme') || 'amoled');

  // Persistent Auth State (BUG-15 Fix)
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('animeking_is_logged_in') === 'true';
  });
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('animeking_user_data');
    return saved ? JSON.parse(saved) : { username: 'AnimeKing_User', avatar: '', status: 'Любитель аниме' };
  });

  useEffect(() => {
    localStorage.setItem('animeking_is_logged_in', isLoggedIn ? 'true' : 'false');
  }, [isLoggedIn]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('animeking_user_data', JSON.stringify(user));
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('animeking_theme', themeMode);
    let effective = themeMode;
    if (themeMode === 'auto') {
      effective = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', effective);
    document.body.setAttribute('data-theme', effective);
  }, [themeMode]);

  // Clean navigation helper
  const navigateTo = (navId) => {
    setSelectedAnime(null);
    setIsPlayerOpen(false);
    setActiveNavState(navId);
  };

  const openAnimeDetails = (anime) => {
    setSelectedAnime(anime);
    setIsPlayerOpen(false);
  };

  const openPlayer = (anime) => {
    if (anime) setSelectedAnime(anime);
    setIsPlayerOpen(true);
  };

  const loginUser = (username, authMethod = 'manual') => {
    setIsLoggedIn(true);
    setUser({
      username: username || 'AnimeKing_User',
      status: authMethod === 'google' ? 'Google OAuth Пользователь' : 'Авторизованный пользователь',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=' + (username || 'KingHub')
    });
  };

  const logoutUser = () => {
    setIsLoggedIn(false);
    setUser({ username: 'AnimeKing_User', avatar: '', status: 'Любитель аниме' });
    localStorage.removeItem('animeking_is_logged_in');
    localStorage.removeItem('animeking_user_data');
  };

  return (
    <AppContext.Provider value={{
      activeNav,
      navigateTo,
      selectedAnime,
      setSelectedAnime,
      openAnimeDetails,
      isPlayerOpen,
      setIsPlayerOpen,
      openPlayer,
      themeMode,
      setThemeMode,
      isLoggedIn,
      user,
      loginUser,
      logoutUser
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
