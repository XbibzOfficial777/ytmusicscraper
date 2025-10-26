import { AudioQuality, AudioFormat } from '@/types/enums';

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  outputDir: './downloads',
  quality: AudioQuality.HIGH,
  format: AudioFormat.MP3,
  metadata: true,
  parallelDownloads: 3,
  retryAttempts: 3,
  retryDelay: 1000,
  timeout: 30000,
  overwrite: false,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  filenameTemplate: '{artist} - {title}',
} ;

/**
 * YouTube URL patterns
 */
export const YOUTUBE_URL_PATTERNS = {
  video: /^https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
  short: /^https?:\/\/youtu\.be\/([a-zA-Z0-9_-]+)/,
  embed: /^https?:\/\/(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
  playlist: /^https?:\/\/(?:www\.)?youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/,
  musicVideo: /^https?:\/\/music\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
  musicPlaylist: /^https?:\/\/music\.youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/,
  musicAlbum: /^https?:\/\/music\.youtube\.com\/browse\/([a-zA-Z0-9_-]+)\?.*browseId=([a-zA-Z0-9_-]+)/,
} as const;

/**
 * Audio quality mapping to bitrate
 */
export const QUALITY_BITRATE_MAP = {
  [AudioQuality.LOWEST]: 64,
  [AudioQuality.LOW]: 128,
  [AudioQuality.MEDIUM]: 192,
  [AudioQuality.HIGH]: 256,
  [AudioQuality.HIGHEST]: 320,
} as const;

/**
 * Supported audio formats
 */
export const SUPPORTED_FORMATS = Object.values(AudioFormat);

/**
 * Maximum file size in bytes (100MB)
 */
export const MAX_FILE_SIZE = 100 * 1024 * 1024;

/**
 * Default request headers
 */
export const DEFAULT_HEADERS = {
  'User-Agent': DEFAULT_CONFIG.userAgent,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
} as const;

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  YOUTUBE_API: 'https://www.googleapis.com/youtube/v3',
  YOUTUBE_MUSIC_API: 'https://music.youtube.com/youtubei/v1',
  INNERTUBE_API: 'https://youtubei.googleapis.com/youtubei/v1',
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  INVALID_URL: 'Invalid YouTube URL provided',
  NETWORK_ERROR: 'Network error occurred',
  PARSE_ERROR: 'Failed to parse response',
  DOWNLOAD_ERROR: 'Failed to download media',
  CONVERSION_ERROR: 'Failed to convert media',
  FILE_SYSTEM_ERROR: 'File system error occurred',
  AUTHENTICATION_ERROR: 'Authentication failed',
  RATE_LIMIT_ERROR: 'Rate limit exceeded',
  UNKNOWN_ERROR: 'An unknown error occurred',
} as const;

/**
 * Regular expressions for metadata extraction
 */
export const METADATA_REGEX = {
  TITLE: /<title>(.*?)<\/title>/i,
  ARTIST: /by (.*?)\s*\|/i,
  ALBUM: /from (.*?)\s*\|/i,
  DURATION: /duration":"(\d+)"/i,
  VIEWS: /viewCount":"(\d+)"/i,
  LIKES: /likeCount":"(\d+)"/i,
} as const;

/**
 * File extensions for different formats
 */
export const FILE_EXTENSIONS = {
  [AudioFormat.MP3]: '.mp3',
  [AudioFormat.WAV]: '.wav',
  [AudioFormat.FLAC]: '.flac',
  [AudioFormat.AAC]: '.aac',
  [AudioFormat.OGG]: '.ogg',
} as const;

/**
 * MIME types for different formats
 */
export const MIME_TYPES = {
  [AudioFormat.MP3]: 'audio/mpeg',
  [AudioFormat.WAV]: 'audio/wav',
  [AudioFormat.FLAC]: 'audio/flac',
  [AudioFormat.AAC]: 'audio/aac',
  [AudioFormat.OGG]: 'audio/ogg',
} as const;

/**
 * FFmpeg options for different formats and qualities
 */
export const FFMPEG_OPTIONS = {
  [AudioFormat.MP3]: {
    [AudioQuality.LOWEST]: ['-codec:a', 'libmp3lame', '-b:a', '64k'],
    [AudioQuality.LOW]: ['-codec:a', 'libmp3lame', '-b:a', '128k'],
    [AudioQuality.MEDIUM]: ['-codec:a', 'libmp3lame', '-b:a', '192k'],
    [AudioQuality.HIGH]: ['-codec:a', 'libmp3lame', '-b:a', '256k'],
    [AudioQuality.HIGHEST]: ['-codec:a', 'libmp3lame', '-b:a', '320k'],
  },
  [AudioFormat.WAV]: {
    [AudioQuality.LOWEST]: ['-codec:a', 'pcm_s16le', '-ar', '22050'],
    [AudioQuality.LOW]: ['-codec:a', 'pcm_s16le', '-ar', '44100'],
    [AudioQuality.MEDIUM]: ['-codec:a', 'pcm_s24le', '-ar', '48000'],
    [AudioQuality.HIGH]: ['-codec:a', 'pcm_s24le', '-ar', '96000'],
    [AudioQuality.HIGHEST]: ['-codec:a', 'pcm_s32le', '-ar', '192000'],
  },
  [AudioFormat.FLAC]: {
    [AudioQuality.LOWEST]: ['-codec:a', 'flac', '-compression_level', '0'],
    [AudioQuality.LOW]: ['-codec:a', 'flac', '-compression_level', '3'],
    [AudioQuality.MEDIUM]: ['-codec:a', 'flac', '-compression_level', '6'],
    [AudioQuality.HIGH]: ['-codec:a', 'flac', '-compression_level', '8'],
    [AudioQuality.HIGHEST]: ['-codec:a', 'flac', '-compression_level', '12'],
  },
  [AudioFormat.AAC]: {
    [AudioQuality.LOWEST]: ['-codec:a', 'aac', '-b:a', '64k'],
    [AudioQuality.LOW]: ['-codec:a', 'aac', '-b:a', '128k'],
    [AudioQuality.MEDIUM]: ['-codec:a', 'aac', '-b:a', '192k'],
    [AudioQuality.HIGH]: ['-codec:a', 'aac', '-b:a', '256k'],
    [AudioQuality.HIGHEST]: ['-codec:a', 'aac', '-b:a', '320k'],
  },
  [AudioFormat.OGG]: {
    [AudioQuality.LOWEST]: ['-codec:a', 'libvorbis', '-b:a', '64k'],
    [AudioQuality.LOW]: ['-codec:a', 'libvorbis', '-b:a', '128k'],
    [AudioQuality.MEDIUM]: ['-codec:a', 'libvorbis', '-b:a', '192k'],
    [AudioQuality.HIGH]: ['-codec:a', 'libvorbis', '-b:a', '256k'],
    [AudioQuality.HIGHEST]: ['-codec:a', 'libvorbis', '-b:a', '320k'],
  },
} as const;
