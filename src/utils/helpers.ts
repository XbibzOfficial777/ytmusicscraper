import { TrackInfo, PlaylistInfo, DownloadProgress, DownloaderConfig } from '@/types/interfaces';
import { AudioFormat, AudioQuality, DownloadStatus } from '@/types/enums';
import {
  DEFAULT_CONFIG,
  YOUTUBE_URL_PATTERNS,
  QUALITY_BITRATE_MAP,
  FILE_EXTENSIONS,
  METADATA_REGEX,
  FFMPEG_OPTIONS,
} from '@/utils/constants';
import sanitize from 'sanitize-filename';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { dirname, join, extname, basename } from 'path';
import { Readable } from 'stream';
import { promisify } from 'util';
import { pipeline } from 'stream';

/**
 * Extract video ID from YouTube URL
 */
export function extractVideoId(url: string): string | null {
  for (const pattern of Object.values(YOUTUBE_URL_PATTERNS)) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

/**
 * Extract playlist ID from YouTube URL
 */
export function extractPlaylistId(url: string): string | null {
  const match = url.match(YOUTUBE_URL_PATTERNS.playlist);
  if (match) {
    return match[1];
  }
  return null;
}

/**
 * Check if URL is a valid YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  return Object.values(YOUTUBE_URL_PATTERNS).some(pattern => pattern.test(url));
}

/**
 * Determine URL type (track, playlist, album, unknown)
 */
export function getUrlType(url: string): 'track' | 'playlist' | 'album' | 'unknown' {
  if (YOUTUBE_URL_PATTERNS.video.test(url) || 
      YOUTUBE_URL_PATTERNS.short.test(url) || 
      YOUTUBE_URL_PATTERNS.embed.test(url) ||
      YOUTUBE_URL_PATTERNS.musicVideo.test(url)) {
    return 'track';
  }
  
  if (YOUTUBE_URL_PATTERNS.playlist.test(url) || 
      YOUTUBE_URL_PATTERNS.musicPlaylist.test(url)) {
    return 'playlist';
  }
  
  if (YOUTUBE_URL_PATTERNS.musicAlbum.test(url)) {
    return 'album';
  }
  
  return 'unknown';
}

/**
 * Format filename based on track info and template
 */
export function formatFilename(trackInfo: TrackInfo, template?: string): string {
  const filenameTemplate = template || DEFAULT_CONFIG.filenameTemplate;
  
  return filenameTemplate
    .replace(/{title}/g, trackInfo.title)
    .replace(/{artist}/g, trackInfo.artist)
    .replace(/{album}/g, trackInfo.album || 'Unknown Album')
    .replace(/{year}/g, (trackInfo.year || 'Unknown').toString())
    .replace(/{trackNumber}/g, (trackInfo.trackNumber || 1).toString())
    .replace(/{id}/g, trackInfo.id);
}

/**
 * Sanitize filename for file system
 */
export function sanitizeFilename(filename: string): string {
  return sanitize(filename, { replacement: '_' });
}

/**
 * Get file extension for format
 */
export function getFileExtension(format: AudioFormat): string {
  return FILE_EXTENSIONS[format];
}

/**
 * Create download progress object
 */
export function createDownloadProgress(
  downloaded: number,
  total: number,
  speed: number,
  eta: number,
  status: DownloadStatus = DownloadStatus.DOWNLOADING
): DownloadProgress {
  const percent = total > 0 ? Math.round((downloaded / total) * 100) : 0;
  
  return {
    percent,
    downloaded,
    total,
    speed,
    eta,
    status,
  };
}

/**
 * Create directory if it doesn't exist
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Get output file path
 */
export function getOutputFilePath(
  outputDir: string,
  trackInfo: TrackInfo,
  format: AudioFormat,
  template?: string
): string {
  ensureDirectoryExists(outputDir);
  
  const filename = formatFilename(trackInfo, template);
  const sanitizedFilename = sanitizeFilename(filename);
  const extension = getFileExtension(format);
  
  return join(outputDir, `${sanitizedFilename}${extension}`);
}

/**
 * Stream to file with progress tracking
 */
export async function streamToFile(
  stream: Readable,
  filePath: string,
  onProgress?: (progress: DownloadProgress) => void
): Promise<void> {
  ensureDirectoryExists(dirname(filePath));
  
  const writeStream = createWriteStream(filePath);
  const streamPipeline = promisify(pipeline);
  
  let downloaded = 0;
  let total = 0;
  let lastProgressTime = Date.now();
  
  // Try to get content length from headers
  stream.on('response', (response) => {
    total = parseInt(response.headers['content-length'] || '0', 10);
  });
  
  // Track download progress
  stream.on('data', (chunk) => {
    downloaded += chunk.length;
    
    // Only update progress every 500ms to avoid excessive updates
    const now = Date.now();
    if (now - lastProgressTime > 500 && onProgress) {
      const speed = downloaded / ((now - lastProgressTime) / 1000);
      const eta = total > 0 && speed > 0 ? (total - downloaded) / speed : 0;
      
      onProgress(createDownloadProgress(downloaded, total, speed, eta));
      lastProgressTime = now;
    }
  });
  
  try {
    await streamPipeline(stream, writeStream);
    
    // Final progress update
    if (onProgress) {
      onProgress(createDownloadProgress(downloaded, total, 0, 0, DownloadStatus.COMPLETED));
    }
  } catch (error) {
    // Final progress update with error status
    if (onProgress) {
      onProgress(createDownloadProgress(downloaded, total, 0, 0, DownloadStatus.FAILED));
    }
    throw error;
  }
}

/**
 * Get FFmpeg options for format and quality
 */
export function getFFmpegOptions(format: AudioFormat, quality: AudioQuality): readonly string[] {
  return FFMPEG_OPTIONS[format]?.[quality] || [];
}

/**
 * Parse duration string to seconds
 */
export function parseDuration(duration: string): number {
  if (!duration) return 0;
  
  let match: RegExpMatchArray | null;
  
  // Handle format like "PT4M13S" (ISO 8601)
  if (duration.startsWith('PT')) {
    let match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);
    
    return hours * 3600 + minutes * 60 + seconds;
  }
  
  // Handle format like "4:13"
  match = duration.match(/(\d+):(\d+)/);
  if (match) {
    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    return minutes * 60 + seconds;
  }
  
  // Handle format like "253" (seconds)
  const seconds = parseInt(duration, 10);
  return isNaN(seconds) ? 0 : seconds;
}

/**
 * Format seconds to human-readable duration
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof result[key] === 'object' &&
        result[key] !== null &&
        !Array.isArray(result[key])
      ) {
        result[key] = deepMerge(result[key], source[key] as any);
      } else {
        result[key] = source[key] as any;
      }
    }
  }
  
  return result;
}

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  attempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i < attempts - 1) {
        await sleep(delay * Math.pow(2, i));
      }
    }
  }
  
  throw lastError!;
}

/**
 * Create a promise with timeout
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
    })
  ]);
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle a function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
}

/**
 * Generate a random string
 */
export function randomString(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Check if a value is a promise
 */
export function isPromise(value: any): value is Promise<any> {
  return value && typeof value.then === 'function';
}



/**
 * Create a simple queue for limiting concurrent operations
 */
export function createQueue<T>(concurrency: number = 1) {
  let running = 0;
  const queue: Array<() => void> = [];
  
  return {
    async add<T>(fn: () => Promise<T>): Promise<T> {
      return new Promise((resolve, reject) => {
        const run = async () => {
          running++;
          try {
            const result = await fn();
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            running--;
            if (queue.length > 0) {
              const next = queue.shift();
              if (next) next();
            }
          }
        };
        
        if (running < concurrency) {
          run();
        } else {
          queue.push(run);
        }
      });
    }
  };
}
