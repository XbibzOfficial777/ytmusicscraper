import { Readable } from 'stream';
import { AudioFormat, AudioQuality, DownloadStatus, SearchType } from './enums';

interface EventEmitter extends NodeJS.EventEmitter {}

/**
 * Configuration options for the YT Music Downloader
 */
export interface DownloaderConfig {
  /** Directory to save downloaded files */
  outputDir?: string;
  /** Audio quality (highest, high, medium, low) */
  quality?: AudioQuality;
  /** Output format (mp3, wav, flac, etc.) */
  format?: AudioFormat;
  /** Whether to include metadata in the downloaded files */
  metadata?: boolean;
  /** Number of parallel downloads */
  parallelDownloads?: number;
  /** Number of retry attempts for failed downloads */
  retryAttempts?: number;
  /** Delay between retry attempts in milliseconds */
  retryDelay?: number;
  /** Progress callback function */
  progressCallback?: (progress: DownloadProgress) => void;
  /** API key for YouTube Data API (optional) */
  apiKey?: string;
  /** Custom user agent for requests */
  userAgent?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Whether to overwrite existing files */
  overwrite?: boolean;
  /** Custom filename template */
  filenameTemplate?: string;
  /** Proxy configuration */
  proxy?: ProxyConfig;
  /** Custom headers for requests */
  headers?: Record<string, string>;
}

/**
 * Proxy configuration
 */
export interface ProxyConfig {
  host: string;
  port: number;
  protocol?: 'http' | 'https';
  auth?: {
    username: string;
    password: string;
  };
}

/**
 * Download progress information
 */
export interface DownloadProgress {
  /** Total percentage of the download (0-100) */
  percent: number;
  /** Downloaded size in bytes */
  downloaded: number;
  /** Total size in bytes */
  total: number;
  /** Download speed in bytes per second */
  speed: number;
  /** Remaining time in seconds */
  eta: number;
  /** Current status of the download */
  status: DownloadStatus;
  /** Additional information */
  info?: Record<string, any>;
}

/**
 * Track information
 */
export interface TrackInfo {
  /** YouTube video ID */
  id: string;
  /** Track title */
  title: string;
  /** Artist name */
  artist: string;
  /** Album name */
  album?: string;
  /** Release year */
  year?: number;
  /** Track duration in seconds */
  duration: number;
  /** Thumbnail URL */
  thumbnail?: string;
  /** Track URL */
  url: string;
  /** Whether the track is explicit */
  explicit?: boolean;
  /** Track genre */
  genre?: string;
  /** Track number in album */
  trackNumber?: number;
  /** Total tracks in album */
  totalTracks?: number;
  /** Disc number */
  discNumber?: number;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Playlist information
 */
export interface PlaylistInfo {
  /** Playlist ID */
  id: string;
  /** Playlist title */
  title: string;
  /** Playlist description */
  description?: string;
  /** Number of tracks in the playlist */
  trackCount: number;
  /** Playlist URL */
  url: string;
  /** Playlist thumbnail */
  thumbnail?: string;
  /** Channel name */
  channelName?: string;
  /** Channel ID */
  channelId?: string;
  /** Tracks in the playlist */
  tracks: TrackInfo[];
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Download result
 */
export interface DownloadResult {
  /** Whether the download was successful */
  success: boolean;
  /** Local file path */
  filePath?: string;
  /** Track information */
  trackInfo?: TrackInfo;
  /** Error message if download failed */
  error?: string;
  /** Download time in milliseconds */
  downloadTime?: number;
  /** File size in bytes */
  fileSize?: number;
}

/**
 * Batch download result
 */
export interface BatchDownloadResult {
  /** Total number of tracks */
  total: number;
  /** Number of successful downloads */
  successful: number;
  /** Number of failed downloads */
  failed: number;
  /** Results for each track */
  results: DownloadResult[];
  /** Total download time in milliseconds */
  totalTime: number;
}

/**
 * Plugin interface
 */
export interface Plugin {
  /** Plugin name */
  name: string;
  /** Plugin version */
  version: string;
  /** Initialize the plugin */
  init(downloader: IYTMusicDownloader): void;
  /** Called before download starts */
  beforeDownload?(trackInfo: TrackInfo): Promise<void> | void;
  /** Called after download completes */
  afterDownload?(result: DownloadResult): Promise<void> | void;
  /** Called when an error occurs */
  onError?(error: Error, trackInfo?: TrackInfo): Promise<void> | void;
}

/**
 * Middleware function
 */
export type MiddlewareFunction = (
  trackInfo: TrackInfo,
  next: () => Promise<DownloadResult>
) => Promise<DownloadResult>;

/**
 * Search options
 */
export interface SearchOptions {
  /** Maximum number of results */
  maxResults?: number;
  /** Filter by type (song, album, playlist, video) */
  type?: SearchType;
  /** Search query */
  query: string;
  /** Whether to include detailed information */
  detailed?: boolean;
}

/**
 * Search result
 */
export interface SearchResult {
  /** Result type */
  type: SearchType;
  /** Result ID */
  id: string;
  /** Result title */
  title: string;
  /** Result description */
  description?: string;
  /** Result URL */
  url: string;
  /** Thumbnail URL */
  thumbnail?: string;
  /** Duration in seconds (for songs/videos) */
  duration?: number;
  /** Number of items (for playlists/albums) */
  itemCount?: number;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * YouTube Music Downloader class
 */
export interface IYTMusicDownloader {
  /**
   * Download a single track
   * @param url YouTube Music URL
   * @param options Download options
   * @returns Download result
   */
  downloadTrack(url: string, options?: Partial<DownloaderConfig>): Promise<DownloadResult>;
  
  /**
   * Download a playlist
   * @param url YouTube Music playlist URL
   * @param options Download options
   * @returns Batch download result
   */
  downloadPlaylist(url: string, options?: Partial<DownloaderConfig>): Promise<BatchDownloadResult>;
  
  /**
   * Get track information without downloading
   * @param url YouTube Music URL
   * @returns Track information
   */
  getTrackInfo(url: string): Promise<TrackInfo>;
  
  /**
   * Get playlist information without downloading
   * @param url YouTube Music playlist URL
   * @returns Playlist information
   */
  getPlaylistInfo(url: string): Promise<PlaylistInfo>;
  
  /**
   * Search for music on YouTube
   * @param options Search options
   * @returns Search results
   */
  search(options: SearchOptions): Promise<SearchResult[]>;
  
  /**
   * Add a plugin
   * @param plugin Plugin to add
   */
  addPlugin(plugin: Plugin): void;
  
  /**
   * Remove a plugin
   * @param pluginName Name of the plugin to remove
   */
  removePlugin(pluginName: string): void;
  
  /**
   * Add middleware
   * @param middleware Middleware function
   */
  use(middleware: MiddlewareFunction): void;
  
  /**
   * Configure the downloader
   * @param config Configuration options
   */
  configure(config: Partial<DownloaderConfig>): void;
  
  /**
   * Get current configuration
   * @returns Current configuration
   */
  getConfig(): DownloaderConfig;
}
