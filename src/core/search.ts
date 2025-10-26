import { EventEmitter } from 'eventemitter3';
import { DownloaderConfig, SearchOptions, SearchResult } from '@/types/interfaces';
import { SearchType } from '@/types/enums';
import { NetworkError } from '@/errors/customErrors';
import { Scraper } from '@/core/scraper';
import { Parser } from '@/core/parser';

/**
 * Search engine class for YouTube Music
 */
export class SearchEngine extends EventEmitter {
  private config: DownloaderConfig;
  private scraper: Scraper;
  private parser: Parser;

  constructor(config: DownloaderConfig) {
    super();
    this.config = config;
    this.scraper = new Scraper(config);
    this.parser = new Parser();
    
    // Set up event forwarding
    this.setupEventForwarding();
  }

  /**
   * Update configuration
   */
  updateConfig(config: DownloaderConfig): void {
    this.config = config;
    this.scraper.updateConfig(config);
  }

  /**
   * Search for music on YouTube
   */
  async search(options: SearchOptions): Promise<SearchResult[]> {
    this.emit('searching', options.query);
    
    try {
      // Build search URL
      const searchUrl = this.buildSearchUrl(options);
      
      // Scrape search results page
      const html = await this.scraper.scrapePage(searchUrl);
      
      // Parse search results
      const results = this.parser.parseSearchResults(html, options);
      
      this.emit('searched', options.query, results);
      return results;
    } catch (error) {
      this.emit('searchError', options.query, error);
      throw new NetworkError(`Search failed: ${(error as Error).message}`);
    }
  }

  /**
   * Build search URL
   */
  private buildSearchUrl(options: SearchOptions): string {
    const baseUrl = 'https://www.youtube.com/results';
    const params = new URLSearchParams();
    
    params.append('search_query', options.query);
    
    if (options.type) {
      let typeParam = '';
      
      switch (options.type) {
        case SearchType.SONG:
          typeParam = 'music_songs';
          break;
        case SearchType.ALBUM:
          typeParam = 'music_albums';
          break;
        case SearchType.PLAYLIST:
          typeParam = 'music_playlists';
          break;
        case SearchType.VIDEO:
          typeParam = 'video';
          break;
      }
      
      if (typeParam) {
        params.append('sp', typeParam);
      }
    }
    
    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Set up event forwarding from scraper
   */
  private setupEventForwarding(): void {
    // Forward scraper events
    this.scraper.on('scraping', (url) => this.emit('scraping', url));
    this.scraper.on('scraped', (url, data) => this.emit('scraped', url, data));
    this.scraper.on('scrapeError', (url, error) => this.emit('scrapeError', url, error));
  }
}
