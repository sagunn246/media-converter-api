export interface ConvertedTrack {
  filename: string;
  downloadUrl: string;
  bitrate: string;
  size?: string;
  sizeBytes?: number;
  duration?: string;
  durationSeconds?: number;
  createdAt?: string;
  videoTitle?: string;
  videoAuthor?: string;
  thumbnail?: string;
}

export interface HistoryItem extends ConvertedTrack {
  createdAt: string;
}

export interface VideoInfo {
  title: string;
  author: string;
  durationFormatted: string;
  durationSeconds?: number;
  thumbnail: string;
  viewCount?: string | number;
  videoUrl?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  videoTitle?: string;
}
