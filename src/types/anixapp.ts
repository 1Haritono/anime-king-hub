// Anime King Hub / AnixApp Unified Types

export interface YummyAnime {
  id: number;
  anime_id?: number;
  title: string;
  title_orig?: string;
  year?: number;
  posterUrl: string;
  rating?: string;
  status?: string;
  type?: string;
  description?: string;
  shikimoriId?: number;
}

export interface AnixartProfile {
  id: number;
  username: string;
  avatarUrl: string;
  registerDate: string;
  friendsCount: number;
  stats: {
    watching: number;
    planned: number;
    completed: number;
    onHold: number;
    dropped: number;
  };
}

export interface VideoStream {
  videoId: number;
  episodeNumber: string;
  playerName: string;
  dubbing: string;
  iframeUrl: string;
  skips?: {
    opening?: [number, number] | null;
    ending?: [number, number] | null;
  };
}

export interface UpdaterState {
  status: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'installing' | 'error';
  version?: string;
  percent?: number;
  error?: string;
}
