export interface MoodRequest {
  mood?: string;
  language?: string;
  genres?: string[];
  excludedSongs?: string[];
  model?: string;
}

export interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

export interface Song {
  title: string;
  artist: string;
  reason: string;
}
