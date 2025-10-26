/**
 * Audio quality options
 */
export enum AudioQuality {
  LOWEST = 'lowest',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  HIGHEST = 'highest'
}

/**
 * Audio format options
 */
export enum AudioFormat {
  MP3 = 'mp3',
  WAV = 'wav',
  FLAC = 'flac',
  AAC = 'aac',
  OGG = 'ogg'
}

/**
 * Download status
 */
export enum DownloadStatus {
  PENDING = 'pending',
  DOWNLOADING = 'downloading',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * Search type
 */
export enum SearchType {
  SONG = 'song',
  ALBUM = 'album',
  PLAYLIST = 'playlist',
  VIDEO = 'video'
}

/**
 * Error types
 */
export enum ErrorType {
  INVALID_URL = 'INVALID_URL',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  DOWNLOAD_ERROR = 'DOWNLOAD_ERROR',
  CONVERSION_ERROR = 'CONVERSION_ERROR',
  FILE_SYSTEM_ERROR = 'FILE_SYSTEM_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}
