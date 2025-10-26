import { TrackInfo, PlaylistInfo, DownloaderConfig } from '@/types/interfaces';
import { AudioFormat, AudioQuality } from '@/types/enums';
import { isValidYouTubeUrl, getUrlType } from '@/utils/helpers';
import { InvalidURLError } from '@/errors/customErrors';

/**
 * Validate YouTube URL
 */
export function validateYouTubeUrl(url: string): void {
  if (!url || typeof url !== 'string') {
    throw new InvalidURLError('URL is required and must be a string');
  }
  
  if (!isValidYouTubeUrl(url)) {
    throw new InvalidURLError(`Invalid YouTube URL: ${url}`);
  }
}

/**
 * Validate track info
 */
export function validateTrackInfo(trackInfo: TrackInfo): void {
  if (!trackInfo) {
    throw new Error('Track info is required');
  }
  
  if (!trackInfo.id || typeof trackInfo.id !== 'string') {
    throw new Error('Track ID is required and must be a string');
  }
  
  if (!trackInfo.title || typeof trackInfo.title !== 'string') {
    throw new Error('Track title is required and must be a string');
  }
  
  if (!trackInfo.artist || typeof trackInfo.artist !== 'string') {
    throw new Error('Track artist is required and must be a string');
  }
  
  if (typeof trackInfo.duration !== 'number' || trackInfo.duration <= 0) {
    throw new Error('Track duration is required and must be a positive number');
  }
  
  if (!trackInfo.url || typeof trackInfo.url !== 'string') {
    throw new Error('Track URL is required and must be a string');
  }
}

/**
 * Validate playlist info
 */
export function validatePlaylistInfo(playlistInfo: PlaylistInfo): void {
  if (!playlistInfo) {
    throw new Error('Playlist info is required');
  }
  
  if (!playlistInfo.id || typeof playlistInfo.id !== 'string') {
    throw new Error('Playlist ID is required and must be a string');
  }
  
  if (!playlistInfo.title || typeof playlistInfo.title !== 'string') {
    throw new Error('Playlist title is required and must be a string');
  }
  
  if (typeof playlistInfo.trackCount !== 'number' || playlistInfo.trackCount <= 0) {
    throw new Error('Playlist track count is required and must be a positive number');
  }
  
  if (!playlistInfo.url || typeof playlistInfo.url !== 'string') {
    throw new Error('Playlist URL is required and must be a string');
  }
  
  if (!Array.isArray(playlistInfo.tracks)) {
    throw new Error('Playlist tracks must be an array');
  }
  
  if (playlistInfo.tracks.length !== playlistInfo.trackCount) {
    throw new Error('Playlist track count does not match the number of tracks');
  }
  
  // Validate each track in the playlist
  for (const track of playlistInfo.tracks) {
    validateTrackInfo(track);
  }
}

/**
 * Validate downloader configuration
 */
export function validateDownloaderConfig(config: DownloaderConfig): void {
  if (!config) {
    throw new Error('Configuration is required');
  }
  
  // Validate output directory
  if (config.outputDir !== undefined) {
    if (typeof config.outputDir !== 'string') {
      throw new Error('Output directory must be a string');
    }
  }
  
  // Validate quality
  if (config.quality !== undefined) {
    if (!Object.values(AudioQuality).includes(config.quality)) {
      throw new Error(`Invalid quality. Must be one of: ${Object.values(AudioQuality).join(', ')}`);
    }
  }
  
  // Validate format
  if (config.format !== undefined) {
    if (!Object.values(AudioFormat).includes(config.format)) {
      throw new Error(`Invalid format. Must be one of: ${Object.values(AudioFormat).join(', ')}`);
    }
  }
  
  // Validate metadata
  if (config.metadata !== undefined && typeof config.metadata !== 'boolean') {
    throw new Error('Metadata option must be a boolean');
  }
  
  // Validate parallel downloads
  if (config.parallelDownloads !== undefined) {
    if (typeof config.parallelDownloads !== 'number' || config.parallelDownloads <= 0) {
      throw new Error('Parallel downloads must be a positive number');
    }
  }
  
  // Validate retry attempts
  if (config.retryAttempts !== undefined) {
    if (typeof config.retryAttempts !== 'number' || config.retryAttempts < 0) {
      throw new Error('Retry attempts must be a non-negative number');
    }
  }
  
  // Validate retry delay
  if (config.retryDelay !== undefined) {
    if (typeof config.retryDelay !== 'number' || config.retryDelay < 0) {
      throw new Error('Retry delay must be a non-negative number');
    }
  }
  
  // Validate progress callback
  if (config.progressCallback !== undefined && typeof config.progressCallback !== 'function') {
    throw new Error('Progress callback must be a function');
  }
  
  // Validate API key
  if (config.apiKey !== undefined) {
    if (typeof config.apiKey !== 'string') {
      throw new Error('API key must be a string');
    }
  }
  
  // Validate user agent
  if (config.userAgent !== undefined) {
    if (typeof config.userAgent !== 'string') {
      throw new Error('User agent must be a string');
    }
  }
  
  // Validate timeout
  if (config.timeout !== undefined) {
    if (typeof config.timeout !== 'number' || config.timeout <= 0) {
      throw new Error('Timeout must be a positive number');
    }
  }
  
  // Validate overwrite
  if (config.overwrite !== undefined && typeof config.overwrite !== 'boolean') {
    throw new Error('Overwrite option must be a boolean');
  }
  
  // Validate filename template
  if (config.filenameTemplate !== undefined) {
    if (typeof config.filenameTemplate !== 'string') {
      throw new Error('Filename template must be a string');
    }
  }
  
  // Validate proxy configuration
  if (config.proxy !== undefined) {
    if (typeof config.proxy !== 'object' || config.proxy === null) {
      throw new Error('Proxy configuration must be an object');
    }
    
    if (!config.proxy.host || typeof config.proxy.host !== 'string') {
      throw new Error('Proxy host is required and must be a string');
    }
    
    if (!config.proxy.port || typeof config.proxy.port !== 'number') {
      throw new Error('Proxy port is required and must be a number');
    }
    
    if (config.proxy.protocol !== undefined) {
      if (!['http', 'https'].includes(config.proxy.protocol)) {
        throw new Error('Proxy protocol must be either "http" or "https"');
      }
    }
    
    if (config.proxy.auth !== undefined) {
      if (typeof config.proxy.auth !== 'object' || config.proxy.auth === null) {
        throw new Error('Proxy authentication must be an object');
      }
      
      if (!config.proxy.auth.username || typeof config.proxy.auth.username !== 'string') {
        throw new Error('Proxy username is required and must be a string');
      }
      
      if (!config.proxy.auth.password || typeof config.proxy.auth.password !== 'string') {
        throw new Error('Proxy password is required and must be a string');
      }
    }
  }
  
  // Validate headers
  if (config.headers !== undefined) {
    if (typeof config.headers !== 'object' || config.headers === null || Array.isArray(config.headers)) {
      throw new Error('Headers must be an object');
    }
    
    for (const [key, value] of Object.entries(config.headers)) {
      if (typeof key !== 'string' || typeof value !== 'string') {
        throw new Error('All header keys and values must be strings');
      }
    }
  }
}

/**
 * Validate search options
 */
export function validateSearchOptions(options: any): void {
  if (!options) {
    throw new Error('Search options are required');
  }
  
  if (!options.query || typeof options.query !== 'string') {
    throw new Error('Search query is required and must be a string');
  }
  
  if (options.maxResults !== undefined) {
    if (typeof options.maxResults !== 'number' || options.maxResults <= 0) {
      throw new Error('Max results must be a positive number');
    }
  }
  
  if (options.type !== undefined) {
    if (!['song', 'album', 'playlist', 'video'].includes(options.type)) {
      throw new Error('Search type must be one of: song, album, playlist, video');
    }
  }
  
  if (options.detailed !== undefined && typeof options.detailed !== 'boolean') {
    throw new Error('Detailed option must be a boolean');
  }
}

/**
 * Validate file path
 */
export function validateFilePath(filePath: string): void {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('File path is required and must be a string');
  }
  
  // Check for invalid characters in file path
  const invalidChars = /[<>:"|?*]/;
  if (invalidChars.test(filePath)) {
    throw new Error('File path contains invalid characters');
  }
}

/**
 * Validate plugin
 */
export function validatePlugin(plugin: any): void {
  if (!plugin) {
    throw new Error('Plugin is required');
  }
  
  if (typeof plugin !== 'object' || plugin === null) {
    throw new Error('Plugin must be an object');
  }
  
  if (!plugin.name || typeof plugin.name !== 'string') {
    throw new Error('Plugin name is required and must be a string');
  }
  
  if (!plugin.version || typeof plugin.version !== 'string') {
    throw new Error('Plugin version is required and must be a string');
  }
  
  if (typeof plugin.init !== 'function') {
    throw new Error('Plugin must have an init method');
  }
}

/**
 * Validate middleware function
 */
export function validateMiddleware(middleware: any): void {
  if (!middleware || typeof middleware !== 'function') {
    throw new Error('Middleware must be a function');
  }
}
