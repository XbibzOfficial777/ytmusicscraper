import { EventEmitter } from 'eventemitter3';
import { 
  DownloaderConfig, 
  TrackInfo, 
  PlaylistInfo, 
  DownloadResult, 
  BatchDownloadResult, 
  Plugin, 
  MiddlewareFunction,
  IYTMusicDownloader,
  SearchOptions,
  SearchResult
} from '@/types/interfaces';
import { AudioFormat, AudioQuality, DownloadStatus, SearchType } from '@/types/enums';
import { DEFAULT_CONFIG } from '@/utils/constants';
import { 
  extractVideoId, 
  extractPlaylistId, 
  getUrlType,
  getOutputFilePath,
  streamToFile,
  deepMerge,
  createQueue,
  withTimeout,
  retry
} from '@/utils/helpers';
import { 
  validateYouTubeUrl, 
  validateDownloaderConfig, 
  validatePlugin, 
  validateMiddleware 
} from '@/utils/validators';
import { 
  InvalidURLError, 
  NetworkError, 
  DownloadError, 
  ConversionError,
  FileSystemError 
} from '@/errors/customErrors';
import { Scraper } from '@/core/scraper';
import { Parser } from '@/core/parser';
import { AudioConverter } from '@/core/converter';
import { MetadataWriter } from '@/core/metadata';
import { SearchEngine } from '@/core/search';
import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * YouTube Music Downloader class
 */
export class YTMusicDownloader extends EventEmitter implements IYTMusicDownloader {
  private config: DownloaderConfig;
  private plugins: Map<string, Plugin> = new Map();
  private middleware: MiddlewareFunction[] = [];
  private scraper: Scraper;
  private parser: Parser;
  private converter: AudioConverter;
  private metadataWriter: MetadataWriter;
  private searchEngine: SearchEngine;
  private downloadQueue: ReturnType<typeof createQueue>;

  constructor(config: Partial<DownloaderConfig> = {}) {
    super();
    
    // Merge with default config
    this.config = deepMerge(DEFAULT_CONFIG, config);
    
    // Validate configuration
    validateDownloaderConfig(this.config);
    
    // Initialize components
    this.scraper = new Scraper(this.config);
    this.parser = new Parser();
    this.converter = new AudioConverter(this.config);
    this.metadataWriter = new MetadataWriter();
    this.searchEngine = new SearchEngine(this.config);
    
    // Initialize download queue with concurrency limit
    this.downloadQueue = createQueue(this.config.parallelDownloads || 3);
    
    // Set up event forwarding from components
    this.setupEventForwarding();
  }

  /**
   * Download a single track
   */
  async downloadTrack(url: string, options: Partial<DownloaderConfig> = {}): Promise<DownloadResult> {
    const startTime = Date.now();
    
    try {
      // Validate URL
      validateYouTubeUrl(url);
      
      // Check if URL is a track
      const urlType = getUrlType(url);
      if (urlType !== 'track') {
        throw new InvalidURLError(`URL is not a track: ${url}`);
      }
      
      // Merge options with current config
      const downloadConfig = deepMerge(this.config, options);
      
      // Get track info
      const videoId = extractVideoId(url);
      if (!videoId) {
        throw new InvalidURLError(`Could not extract video ID from URL: ${url}`);
      }
      
      const trackInfo = await this.getTrackInfo(url);
      
      // Check if file already exists
      const outputPath = getOutputFilePath(
        downloadConfig.outputDir!,
        trackInfo,
        downloadConfig.format!,
        downloadConfig.filenameTemplate
      );
      
      if (!downloadConfig.overwrite && await this.fileExists(outputPath)) {
        return {
          success: true,
          filePath: outputPath,
          trackInfo,
          downloadTime: Date.now() - startTime,
          fileSize: await this.getFileSize(outputPath)
        };
      }
      
      // Run before download plugins
      await this.runBeforeDownloadPlugins(trackInfo);
      
      // Download with middleware
      const result = await this.runMiddleware(trackInfo, async () => {
        return this.downloadTrackInternal(trackInfo, downloadConfig);
      });
      
      // Run after download plugins
      await this.runAfterDownloadPlugins(result);
      
      return {
        ...result,
        downloadTime: Date.now() - startTime
      };
    } catch (error) {
      const errorObj = error as Error;
      
      // Run error plugins
      await this.runErrorPlugins(errorObj);
      
      return {
        success: false,
        error: errorObj.message,
        downloadTime: Date.now() - startTime
      };
    }
  }

  /**
   * Download a playlist
   */
  async downloadPlaylist(url: string, options: Partial<DownloaderConfig> = {}): Promise<BatchDownloadResult> {
    const startTime = Date.now();
    
    try {
      // Validate URL
      validateYouTubeUrl(url);
      
      // Check if URL is a playlist
      const urlType = getUrlType(url);
      if (urlType !== 'playlist') {
        throw new InvalidURLError(`URL is not a playlist: ${url}`);
      }
      
      // Get playlist info
      const playlistInfo = await this.getPlaylistInfo(url);
      
      // Download all tracks in parallel with queue
      const downloadPromises = playlistInfo.tracks.map(track => 
        this.downloadQueue.add(() => this.downloadTrack(track.url, options))
      );
      
      const results = await Promise.all(downloadPromises);
      
      // Count successful and failed downloads
      const successful = results.filter(result => result.success).length;
      const failed = results.length - successful;
      
      return {
        total: results.length,
        successful,
        failed,
        results,
        totalTime: Date.now() - startTime
      };
    } catch (error) {
      const errorObj = error as Error;
      
      // Run error plugins
      await this.runErrorPlugins(errorObj);
      
      return {
        total: 0,
        successful: 0,
        failed: 1,
        results: [{
          success: false,
          error: errorObj.message
        }],
        totalTime: Date.now() - startTime
      };
    }
  }

  /**
   * Get track information without downloading
   */
  async getTrackInfo(url: string): Promise<TrackInfo> {
    try {
      // Validate URL
      validateYouTubeUrl(url);
      
      // Extract video ID
      const videoId = extractVideoId(url);
      if (!videoId) {
        throw new InvalidURLError(`Could not extract video ID from URL: ${url}`);
      }
      
      // Scrape page
      const html = await this.scraper.scrapePage(url);
      
      // Parse track info
      const trackInfo = this.parser.parseTrackInfo(html, videoId);
      
      return trackInfo;
    } catch (error) {
      throw new NetworkError(`Failed to get track info: ${(error as Error).message}`);
    }
  }

  /**
   * Get playlist information without downloading
   */
  async getPlaylistInfo(url: string): Promise<PlaylistInfo> {
    try {
      // Validate URL
      validateYouTubeUrl(url);
      
      // Extract playlist ID
      const playlistId = extractPlaylistId(url);
      if (!playlistId) {
        throw new InvalidURLError(`Could not extract playlist ID from URL: ${url}`);
      }
      
      // Scrape page
      const html = await this.scraper.scrapePage(url);
      
      // Parse playlist info
      const playlistInfo = this.parser.parsePlaylistInfo(html, playlistId);
      
      return playlistInfo;
    } catch (error) {
      throw new NetworkError(`Failed to get playlist info: ${(error as Error).message}`);
    }
  }

  /**
   * Search for music on YouTube
   */
  async search(options: SearchOptions): Promise<SearchResult[]> {
    try {
      return await this.searchEngine.search(options);
    } catch (error) {
      throw new NetworkError(`Search failed: ${(error as Error).message}`);
    }
  }

  /**
   * Add a plugin
   */
  addPlugin(plugin: Plugin): void {
    validatePlugin(plugin);
    
    // Initialize plugin
    plugin.init(this);
    
    // Store plugin
    this.plugins.set(plugin.name, plugin);
    
    this.emit('pluginAdded', plugin);
  }

  /**
   * Remove a plugin
   */
  removePlugin(pluginName: string): void {
    const plugin = this.plugins.get(pluginName);
    if (plugin) {
      this.plugins.delete(pluginName);
      this.emit('pluginRemoved', plugin);
    }
  }

  /**
   * Add middleware
   */
  use(middleware: MiddlewareFunction): void {
    validateMiddleware(middleware);
    this.middleware.push(middleware);
  }

  /**
   * Configure the downloader
   */
  configure(config: Partial<DownloaderConfig>): void {
    // Merge with current config
    this.config = deepMerge(this.config, config);
    
    // Validate new configuration
    validateDownloaderConfig(this.config);
    
    // Update components with new config
    this.scraper.updateConfig(this.config);
    this.converter.updateConfig(this.config);
    this.searchEngine.updateConfig(this.config);
    
    // Update queue concurrency if changed
    if (config.parallelDownloads) {
      this.downloadQueue = createQueue(config.parallelDownloads);
    }
    
    this.emit('configured', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): DownloaderConfig {
    return { ...this.config };
  }

  /**
   * Internal method to download a track
   */
  private async downloadTrackInternal(
    trackInfo: TrackInfo, 
    config: DownloaderConfig
  ): Promise<DownloadResult> {
    try {
      // Get output path
      const outputPath = getOutputFilePath(
        config.outputDir!,
        trackInfo,
        config.format!,
        config.filenameTemplate
      );
      
      // Create temporary file path
      const tempPath = `${outputPath}.tmp`;
      
      // Download video
      const videoStream = await this.scraper.downloadVideo(trackInfo.url);
      
      // Set up progress tracking
      let progressInterval: NodeJS.Timeout | undefined = undefined;
      
      if (config.progressCallback) {
        progressInterval = setInterval(() => {
          // This is a simplified progress tracking
          // In a real implementation, you would track actual download progress
          config.progressCallback!({
            percent: 0,
            downloaded: 0,
            total: 0,
            speed: 0,
            eta: 0,
            status: DownloadStatus.DOWNLOADING
          });
        }, 1000);
      }
      
      try {
        // Stream to temporary file
        await streamToFile(videoStream, tempPath, config.progressCallback);
        
        // Convert to desired format
        await this.converter.convert(tempPath, outputPath, config.format!, config.quality || DEFAULT_CONFIG.quality);
        
        // Write metadata if enabled
        if (config.metadata) {
          await this.metadataWriter.writeMetadata(outputPath, trackInfo);
        }
        
        // Clean up temporary file
        await fs.unlink(tempPath);
        
        // Clear progress interval
        if (progressInterval) {
          clearInterval(progressInterval);
        }
        
        // Get file size
        const stats = await fs.stat(outputPath);
        
        return {
          success: true,
          filePath: outputPath,
          trackInfo,
          fileSize: stats.size
        };
      } catch (error) {
        // Clean up temporary file if it exists
        try {
          await fs.unlink(tempPath);
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        
        // Clear progress interval
        if (progressInterval) {
          clearInterval(progressInterval);
        }
        
        throw error;
      }
    } catch (error) {
      throw new DownloadError(`Failed to download track: ${(error as Error).message}`);
    }
  }

  /**
   * Run middleware chain
   */
  private async runMiddleware(
    trackInfo: TrackInfo, 
    finalFn: () => Promise<DownloadResult>
  ): Promise<DownloadResult> {
    let index = 0;
    
    const next = async (): Promise<DownloadResult> => {
      if (index >= this.middleware.length) {
        return finalFn();
      }
      
      const middleware = this.middleware[index++];
      return middleware(trackInfo, next);
    };
    
    return next();
  }

  /**
   * Run before download plugins
   */
  private async runBeforeDownloadPlugins(trackInfo: TrackInfo): Promise<void> {
    const promises = Array.from(this.plugins.values())
      .filter(plugin => plugin.beforeDownload)
      .map(plugin => plugin.beforeDownload!(trackInfo));
    
    await Promise.all(promises);
  }

  /**
   * Run after download plugins
   */
  private async runAfterDownloadPlugins(result: DownloadResult): Promise<void> {
    const promises = Array.from(this.plugins.values())
      .filter(plugin => plugin.afterDownload)
      .map(plugin => plugin.afterDownload!(result));
    
    await Promise.all(promises);
  }

  /**
   * Run error plugins
   */
  private async runErrorPlugins(error: Error, trackInfo?: TrackInfo): Promise<void> {
    const promises = Array.from(this.plugins.values())
      .filter(plugin => plugin.onError)
      .map(plugin => plugin.onError!(error, trackInfo));
    
    await Promise.all(promises);
  }

  /**
   * Set up event forwarding from components
   */
  private setupEventForwarding(): void {
    // Forward scraper events
    this.scraper.on('scraping', (url) => this.emit('scraping', url));
    this.scraper.on('scraped', (url, data) => this.emit('scraped', url, data));
    this.scraper.on('scrapeError', (url, error) => this.emit('scrapeError', url, error));
    
    // Forward converter events
    this.converter.on('converting', (inputPath, outputPath) => 
      this.emit('converting', inputPath, outputPath));
    this.converter.on('converted', (inputPath, outputPath) => 
      this.emit('converted', inputPath, outputPath));
    this.converter.on('conversionError', (inputPath, outputPath, error) => 
      this.emit('conversionError', inputPath, outputPath, error));
    
    // Forward search engine events
    this.searchEngine.on('searching', (query) => this.emit('searching', query));
    this.searchEngine.on('searched', (query, results) => this.emit('searched', query, results));
    this.searchEngine.on('searchError', (query, error) => this.emit('searchError', query, error));
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file size
   */
  private async getFileSize(filePath: string): Promise<number> {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch {
      return 0;
    }
  }
}
