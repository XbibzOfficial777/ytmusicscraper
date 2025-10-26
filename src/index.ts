// Export main classes and functions
export { YTMusicDownloader } from './core/downloader';
export { Scraper } from './core/scraper';
export { Parser } from './core/parser';
export { AudioConverter } from './core/converter';
export { MetadataWriter } from './core/metadata';
export { SearchEngine } from './core/search';

// Export types and interfaces
export * from './types/interfaces';
export * from './types/enums';
export * from './types/types';

// Export errors
export * from './errors/customErrors';

// Export utilities
export * from './utils/helpers';
export * from './utils/validators';
export * from './utils/constants';

// Convenience functions for simple usage
import { YTMusicDownloader } from './core/downloader';
import { DownloaderConfig, DownloadResult, BatchDownloadResult } from './types/interfaces';

/**
 * Download a single track
 */
export async function downloadTrack(
  url: string, 
  options?: Partial<DownloaderConfig>
): Promise<DownloadResult> {
  const downloader = new YTMusicDownloader(options);
  return downloader.downloadTrack(url);
}

/**
 * Download a playlist
 */
export async function downloadPlaylist(
  url: string, 
  options?: Partial<DownloaderConfig>
): Promise<BatchDownloadResult> {
  const downloader = new YTMusicDownloader(options);
  return downloader.downloadPlaylist(url);
}
