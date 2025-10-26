import { TrackInfo, PlaylistInfo, SearchResult } from '@/types/interfaces';
import { SearchType } from '@/types/enums';
import { METADATA_REGEX } from '@/utils/constants';
import { parseDuration } from '@/utils/helpers';
import { ParseError } from '@/errors/customErrors';
import * as cheerio from 'cheerio';

/**
 * Parser class for extracting information from HTML
 */
export class Parser {
  /**
   * Parse track information from HTML
   */
  parseTrackInfo(html: string, videoId: string): TrackInfo {
    try {
      const $: cheerio.CheerioAPI = cheerio.load(html) as any;
      
      // Extract basic information
      const title = this.extractTitle($, html);
      const artist = this.extractArtist($, html);
      const album = this.extractAlbum($, html);
      const duration = this.extractDuration($, html);
      const thumbnail = this.extractThumbnail($, videoId);
      
      // Extract additional metadata
      const year = this.extractYear($);
      const explicit = this.extractExplicit($);
      const genre = this.extractGenre($);
      const trackNumber = this.extractTrackNumber($);
      const totalTracks = this.extractTotalTracks($);
      const discNumber = this.extractDiscNumber($);
      
      // Construct track info
      const trackInfo: TrackInfo = {
        id: videoId,
        title,
        artist,
        album,
        year,
        duration,
        thumbnail,
        explicit,
        genre,
        trackNumber,
        totalTracks,
        discNumber,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        metadata: {}
      };
      
      return trackInfo;
    } catch (error) {
      throw new ParseError(`Failed to parse track info: ${(error as Error).message}`);
    }
  }

  /**
   * Parse playlist information from HTML
   */
  parsePlaylistInfo(html: string, playlistId: string): PlaylistInfo {
    try {
      const $: cheerio.CheerioAPI = cheerio.load(html) as any;
      
      // Extract basic information
      const title = this.extractPlaylistTitle($);
      const description = this.extractPlaylistDescription($);
      const trackCount = this.extractPlaylistTrackCount($);
      const thumbnail = this.extractPlaylistThumbnail($);
      const channelName = this.extractPlaylistChannelName($);
      const channelId = this.extractPlaylistChannelId($);
      
      // Extract tracks
      const tracks = this.extractPlaylistTracks($);
      
      // Construct playlist info
      const playlistInfo: PlaylistInfo = {
        id: playlistId,
        title,
        description,
        trackCount,
        thumbnail,
        channelName,
        channelId,
        tracks,
        url: `https://www.youtube.com/playlist?list=${playlistId}`,
        metadata: {}
      };
      
      return playlistInfo;
    } catch (error) {
      throw new ParseError(`Failed to parse playlist info: ${(error as Error).message}`);
    }
  }

  /**
   * Parse search results from HTML
   */
  parseSearchResults(html: string, options: any): SearchResult[] {
    try {
      const $: cheerio.CheerioAPI = cheerio.load(html) as any;
      
      const allResults: SearchResult[] = [];
      const resultContainers = $('.ytd-video-renderer, .ytd-playlist-renderer, .ytd-channel-renderer');
      
      resultContainers.each((index: number, element: cheerio.Element) => {
        const container = $(element);
        
        // Determine result type
        let type: SearchType;
        if (container.hasClass('ytd-video-renderer')) {
          type = SearchType.VIDEO;
        } else if (container.hasClass('ytd-playlist-renderer')) {
          type = SearchType.PLAYLIST;
        } else if (container.hasClass('ytd-channel-renderer')) {
          type = SearchType.ALBUM; // Using album for channels in this context
        } else {
          return; // Skip unknown types
        }
        
        // Extract basic information
        const title = this.extractSearchResultTitle(container);
        const id = this.extractSearchResultId(container, type);
        const url = this.extractSearchResultUrl(container, type);
        const thumbnail = this.extractSearchResultThumbnail(container);
        const description = this.extractSearchResultDescription(container);
        
        // Extract type-specific information
        let duration: number | undefined;
        let itemCount: number | undefined;
        
        if (type === SearchType.VIDEO) {
          duration = this.extractSearchResultDuration(container);
        } else if (type === SearchType.PLAYLIST || type === SearchType.ALBUM) {
          itemCount = this.extractSearchResultItemCount(container);
        }
        
        // Create search result
        const result: SearchResult = {
          type,
          id,
          title,
          description,
          url,
          thumbnail,
          duration,
          itemCount,
          metadata: {}
        };
        
        allResults.push(result);
      });
      
      // Limit results if specified
      if (options.maxResults && allResults.length > options.maxResults) {
        return allResults.slice(0, options.maxResults);
      }
      
      return allResults;
    } catch (error) {
      throw new ParseError(`Failed to parse search results: ${(error as Error).message}`);
    }
  }

  /**
   * Extract title from HTML
   */
  private extractTitle($: cheerio.CheerioAPI, html: string): string {
    // Try different selectors for title
    const selectors = [
      'meta[property="og:title"]',
      'meta[name="title"]',
      'title',
      '.watch-title',
      '#eow-title',
      'h1.title',
      '.ytd-video-primary-info-renderer h1',
      '.video-title'
    ];
    
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length) {
        const title = element.attr('content') || element.text();
        if (title) {
          return title.trim();
        }
      }
    }
    
    // Fallback to regex
    const match = html.match(METADATA_REGEX.TITLE);
    if (match && match[1]) {
      return match[1].replace(' - YouTube', '').trim();
    }
    
    throw new ParseError('Could not extract title');
  }

  /**
   * Extract artist from HTML
   */
  private extractArtist($: cheerio.CheerioAPI, html: string): string {
    // Try different selectors for artist
    const selectors = [
      '.ytd-video-owner-renderer a',
      '.yt-user-info',
      '#watch-uploader-info',
      '#channel-name',
      '.channel-name',
      '.uploader-info'
    ];
    
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length) {
        const artist = element.text();
        if (artist) {
          return artist.trim();
        }
      }
    }
    
    // Fallback to regex
    const match = html.match(METADATA_REGEX.ARTIST);
    if (match && match[1]) {
      return match[1].trim();
    }
    
    // Default to "Unknown Artist"
    return 'Unknown Artist';
  }

  /**
   * Extract album from HTML
   */
  private extractAlbum($: cheerio.CheerioAPI, html: string): string | undefined {
    // Try different selectors for album
    const selectors = [
      '.album-name',
      '.ytd-metadata-row-renderer:nth-child(2) .content',
      '#watch-description-extras .yt-simple-endpoint'
    ];
    
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length) {
        const album = element.text();
        if (album) {
          return album.trim();
        }
      }
    }
    
    // Fallback to regex
    const match = html.match(METADATA_REGEX.ALBUM);
    if (match && match[1]) {
      return match[1].trim();
    }
    
    return undefined;
  }

  /**
   * Extract duration from HTML
   */
  private extractDuration($: cheerio.CheerioAPI, html: string): number {
    // Try different selectors for duration
    const selectors = [
      '.ytp-time-duration',
      '.video-time',
      '.ytd-thumbnail-overlay-time-status-renderer',
      '#movie_player .ytp-time-duration',
      '.timestamp'
    ];
    
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length) {
        const duration = element.text();
        if (duration) {
          return parseDuration(duration.trim());
        }
      }
    }
    
    // Fallback to regex
    const match = html.match(METADATA_REGEX.DURATION);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    
    // Default to 0
    return 0;
  }

  /**
   * Extract thumbnail from HTML
   */
  private extractThumbnail($: cheerio.CheerioAPI, videoId: string): string | undefined {
    // Try different selectors for thumbnail
    const selectors = [
      'meta[property="og:image"]',
      'link[itemprop="thumbnailUrl"]',
      '.ytp-thumbnail-image',
      '#img'
    ];
    
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length) {
        const thumbnail = element.attr('content') || element.attr('href') || element.attr('src');
        if (thumbnail) {
          return thumbnail.trim();
        }
      }
    }
    
    // Fallback to default thumbnail URL
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }

  /**
   * Extract year from HTML
   */
  private extractYear($: cheerio.CheerioAPI): number | undefined {
    // Try different selectors for year
    const selectors = [
      '.date',
      '.publish-date',
      '#watch-uploader-info .yt-user-info',
      '.ytd-video-primary-info-renderer .date'
    ];
    
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length) {
        const dateText = element.text();
        if (dateText) {
          // Try to extract year from date text
          const yearMatch = dateText.match(/\b(19|20)\d{2}\b/);
          if (yearMatch) {
            return parseInt(yearMatch[0], 10);
          }
        }
      }
    }
    
    return undefined;
  }

  /**
   * Extract explicit flag from HTML
   */
  private extractExplicit($: cheerio.CheerioAPI): boolean | undefined {
    // Try different selectors for explicit flag
    const selectors = [
      '.explicit-badge',
      '.ytd-badge-supported-renderer.badge-style-type-verified-artist',
      '.badge-style-type-verified-artist'
    ];
    
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length) {
        const text = element.text();
        if (text && text.toLowerCase().includes('explicit')) {
          return true;
        }
      }
    }
    
    return undefined;
  }

  /**
   * Extract genre from HTML
   */
  private extractGenre($: cheerio.CheerioAPI): string | undefined {
    // Try different selectors for genre
    const selectors = [
      '.genre',
      '.ytd-metadata-row-renderer:contains("Genre") .content',
      '#watch-description-extras .yt-simple-endpath'
    ];
    
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length) {
        const genre = element.text();
        if (genre) {
          return genre.trim();
        }
      }
    }
    
    return undefined;
  }

  /**
   * Extract track number from HTML
   */
  private extractTrackNumber($: cheerio.CheerioAPI): number | undefined {
    // Try different selectors for track number
    const selectors = [
      '.track-number',
      '.ytd-metadata-row-renderer:contains("Track") .content'
    ];
    
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length) {
        const trackNumberText = element.text();
        if (trackNumberText) {
          const trackNumber = parseInt(trackNumberText.trim(), 10);
          if (!isNaN(trackNumber)) {
            return trackNumber;
          }
        }
      }
    }
    
    return undefined;
  }

  /**
   * Extract total tracks from HTML
   */
  private extractTotalTracks($: cheerio.CheerioAPI): number | undefined {
    // Try different selectors for total tracks
    const selectors = [
      '.total-tracks',
      '.ytd-metadata-row-renderer:contains("Tracks") .content'
    ];
    
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length) {
        const totalTracksText = element.text();
        if (totalTracksText) {
          const totalTracks = parseInt(totalTracksText.trim(), 10);
          if (!isNaN(totalTracks)) {
            return totalTracks;
          }
        }
      }
    }
    
    return undefined;
  }

  /**
   * Extract disc number from HTML
   */
  private extractDiscNumber($: cheerio.CheerioAPI): number | undefined {
    // Try different selectors for disc number
    const selectors = [
      '.disc-number',
      '.ytd-metadata-row-renderer:contains("Disc") .content'
    ];
    
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length) {
        const discNumberText = element.text();
        if (discNumberText) {
          const discNumber = parseInt(discNumberText.trim(), 10);
          if (!isNaN(discNumber)) {
            return discNumber;
          }
        }
      }
    }
    
    return undefined;
  }

  /**
   * Extract playlist title from HTML
   */
  private extractPlaylistTitle($: cheerio.CheerioAPI): string {
    // Try different selectors for playlist title
    const selectors = [
      'meta[property="og:title"]',
      'h1.pl-header-title',
      '.pl-header-title',
      '.title',
      '#title'
    ];
    
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length) {
        const title = element.attr('content') || element.text();
        if (title) {
          return title.trim();
        }
      }
    }
    
    throw new ParseError('Could not extract playlist title');
  }

  /**
   * Extract playlist description from HTML
   */
  private extractPlaylistDescription($: cheerio.CheerioAPI): string | undefined {
    // Try different selectors for playlist description
    const selectors = [
      'meta[property="og:description"]',
      '.pl-header-description',
      '.description',
      '#description'
    ];
    
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length) {
        const description = element.attr('content') || element.text();
        if (description) {
          return description.trim();
        }
      }
    }
    
    return undefined;
  }

  /**
   * Extract playlist track count from HTML
   */
  private extractPlaylistTrackCount($: cheerio.CheerioAPI): number {
    // Try different selectors for playlist track count
    const selectors = [
      '.pl-header-details',
      '.stats',
      '.playlist-stats'
    ];
    
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length) {
        const text = element.text();
        if (text) {
          // Try to extract track count from text
          const match = text.match(/(\d+)\s*(?:songs|tracks|videos)/i);
          if (match) {
            return parseInt(match[1], 10);
          }
        }
      }
    }
    
    throw new ParseError('Could not extract playlist track count');
  }

  /**
   * Extract playlist thumbnail from HTML
   */
  private extractPlaylistThumbnail($: cheerio.CheerioAPI): string | undefined {
    // Try different selectors for playlist thumbnail
    const selectors = [
      'meta[property="og:image"]',
      '.pl-header-thumb img',
      '.thumbnail img',
      '#thumbnail img'
    ];
    
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length) {
        const thumbnail = element.attr('content') || element.attr('src');
        if (thumbnail) {
          return thumbnail.trim();
        }
      }
    }
    
    return undefined;
  }

  /**
   * Extract playlist channel name from HTML
   */
  private extractPlaylistChannelName($: cheerio.CheerioAPI): string | undefined {
    const selectors = [
      '.pl-header-details li a',
      '.channel-name',
      '.uploader a',
      '#uploader a'
    ];
    
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length) {
        const channelName = element.text();
        if (channelName) {
          return channelName.trim();
        }
      }
    }
    
    return undefined;
  }

  /**
   * Extract playlist channel ID from HTML
   */
  private extractPlaylistChannelId($: cheerio.CheerioAPI): string | undefined {
    // Try different selectors for playlist channel ID
    const selectors = [
      '.pl-header-details li:nth-child(2) a',
      '.channel-name',
      '.uploader a',
      '#uploader a'
    ];
    
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length) {
        const href = element.attr('href');
        if (href) {
          // Extract channel ID from href
          const match = href.match(/\/channel\/([^/?]+)/);
          if (match) {
            return match[1];
          }
          
          // Extract user ID from href
          const userMatch = href.match(/\/user\/([^/?]+)/);
          if (userMatch) {
            return userMatch[1];
          }
          
          // Extract custom handle from href
          const handleMatch = href.match(/\/@([^/?]+)/);
          if (handleMatch) {
            return handleMatch[1];
          }
        }
      }
    }
    
    return undefined;
  }

  private extractPlaylistTracks($: cheerio.CheerioAPI): TrackInfo[] {
    const tracks: TrackInfo[] = [];
    
    const trackElements = $('.pl-video');
    
    if (!trackElements.length) {
      throw new ParseError('Could not find playlist tracks');
    }
    
    // Extract information for each track
    trackElements.each((index: number, element: cheerio.Element) => {
      const trackElement = $(element);
      
      // Extract video ID
      const videoId = this.extractTrackVideoId(trackElement);
      if (!videoId) {
        return; // Skip this track if no video ID
      }
      
      // Extract title
      const title = this.extractTrackTitle(trackElement);
      if (!title) {
        return; // Skip this track if no title
      }
      
      // Extract artist
      const artist = this.extractTrackArtist(trackElement) || 'Unknown Artist';
      
      // Extract duration
      const duration = this.extractTrackDuration(trackElement) || 0;
      
      // Extract thumbnail
      const thumbnail = this.extractTrackThumbnail(trackElement, videoId);
      
      // Create track info
      const trackInfo: TrackInfo = {
        id: videoId,
        title,
        artist,
        duration,
        thumbnail,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        metadata: {}
      };
      
      tracks.push(trackInfo);
    });
    
    return tracks;
  }

  /**
   * Extract video ID from track element
   */
  private extractTrackVideoId(trackElement: cheerio.Cheerio): string | null {
    // Try different selectors for video ID
    const selectors = [
      'a',
      '.pl-video-title-link',
      '.ytd-playlist-video-renderer a'
    ];
    
    for (const selector of selectors) {
      const element = trackElement.find(selector);
      if (element.length) {
        const href = element.attr('href');
        if (href) {
          // Extract video ID from href
          const match = href.match(/watch\?v=([^&]+)/);
          if (match) {
            return match[1];
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Extract title from track element
   */
  private extractTrackTitle(trackElement: cheerio.Cheerio): string | null {
    // Try different selectors for title
    const selectors = [
      'a',
      '.pl-video-title',
      '.title',
      '.ytd-playlist-video-renderer #video-title'
    ];
    
    for (const selector of selectors) {
      const element = trackElement.find(selector);
      if (element.length) {
        const title = element.text();
        if (title) {
          return title.trim();
        }
      }
    }
    
    return null;
  }

  /**
   * Extract artist from track element
   */
  private extractTrackArtist(trackElement: cheerio.Cheerio): string | null {
    // Try different selectors for artist
    const selectors = [
      '.pl-video-owner',
      '.by',
      '.ytd-playlist-video-renderer #byline'
    ];
    
    for (const selector of selectors) {
      const element = trackElement.find(selector);
      if (element.length) {
        const artist = element.text();
        if (artist) {
          return artist.trim();
        }
      }
    }
    
    return null;
  }

  /**
   * Extract duration from track element
   */
  private extractTrackDuration(trackElement: cheerio.Cheerio): number | null {
    // Try different selectors for duration
    const selectors = [
      '.pl-video-time',
      '.timestamp',
      '.ytd-thumbnail-overlay-time-status-renderer'
    ];
    
    for (const selector of selectors) {
      const element = trackElement.find(selector);
      if (element.length) {
        const duration = element.text();
        if (duration) {
          return parseDuration(duration.trim());
        }
      }
    }
    
    return null;
  }

  /**
   * Extract thumbnail from track element
   */
  private extractTrackThumbnail(trackElement: cheerio.Cheerio, videoId: string): string | undefined {
    // Try different selectors for thumbnail
    const selectors = [
      'img',
      '.thumb',
      '.ytd-playlist-video-renderer img'
    ];
    
    for (const selector of selectors) {
      const element = trackElement.find(selector);
      if (element.length) {
        const thumbnail = element.attr('src');
        if (thumbnail) {
          return thumbnail.trim();
        }
      }
    }
    
    // Fallback to default thumbnail URL
    return `https://img.youtube.com/vi/${videoId}/default.jpg`;
  }

  /**
   * Extract title from search result element
   */
  private extractSearchResultTitle(element: cheerio.Cheerio): string {
    // Try different selectors for title
    const selectors = [
      '#video-title',
      '#playlist-title',
      '.title',
      'a#video-title',
      'a#playlist-title'
    ];
    
    for (const selector of selectors) {
      const titleElement = element.find(selector);
      if (titleElement.length) {
        const title = titleElement.text();
        if (title) {
          return title.trim();
        }
      }
    }
    
    return 'Unknown Title';
  }

  /**
   * Extract ID from search result element
   */
  private extractSearchResultId(element: cheerio.Cheerio, type: SearchType): string {
    // Try different selectors for ID based on type
    let selector: string;
    
    switch (type) {
      case SearchType.VIDEO:
        selector = 'a';
        break;
      case SearchType.PLAYLIST:
        selector = 'a';
        break;
      case SearchType.ALBUM:
        selector = 'a';
        break;
      default:
        return 'unknown';
    }
    
    const linkElement = element.find(selector);
    if (linkElement.length) {
      const href = linkElement.attr('href');
      if (href) {
        // Extract ID from href
        if (type === SearchType.VIDEO) {
          const match = href.match(/watch\?v=([^&]+)/);
          if (match) {
            return match[1];
          }
        } else if (type === SearchType.PLAYLIST) {
          const match = href.match(/list=([^&]+)/);
          if (match) {
            return match[1];
          }
        } else if (type === SearchType.ALBUM) {
          const match = href.match(/\/channel\/([^/?]+)/);
          if (match) {
            return match[1];
          }
        }
      }
    }
    
    return 'unknown';
  }

  /**
   * Extract URL from search result element
   */
  private extractSearchResultUrl(element: cheerio.Cheerio, type: SearchType): string {
    // Try different selectors for URL based on type
    let selector: string;
    
    switch (type) {
      case SearchType.VIDEO:
        selector = 'a';
        break;
      case SearchType.PLAYLIST:
        selector = 'a';
        break;
      case SearchType.ALBUM:
        selector = 'a';
        break;
      default:
        return '#';
    }
    
    const linkElement = element.find(selector);
    if (linkElement.length) {
      const href = linkElement.attr('href');
      if (href) {
        // Make sure URL is absolute
        if (href.startsWith('/')) {
          return `https://www.youtube.com${href}`;
        }
        return href;
      }
    }
    
    return '#';
  }

  /**
   * Extract thumbnail from search result element
   */
  private extractSearchResultThumbnail(element: cheerio.Cheerio): string | undefined {
    // Try different selectors for thumbnail
    const selectors = [
      'img',
      '.thumbnail img',
      '.ytd-thumbnail img'
    ];
    
    for (const selector of selectors) {
      const imgElement = element.find(selector);
      if (imgElement.length) {
        const thumbnail = imgElement.attr('src');
        if (thumbnail) {
          return thumbnail.trim();
        }
      }
    }
    
    return undefined;
  }

  /**
   * Extract description from search result element
   */
  private extractSearchResultDescription(element: cheerio.Cheerio): string | undefined {
    // Try different selectors for description
    const selectors = [
      '.description',
      '.ytd-video-renderer #description-text',
      '.metadata-snippet-text'
    ];
    
    for (const selector of selectors) {
      const descElement = element.find(selector);
      if (descElement.length) {
        const description = descElement.text();
        if (description) {
          return description.trim();
        }
      }
    }
    
    return undefined;
  }

  /**
   * Extract duration from search result element
   */
  private extractSearchResultDuration(element: cheerio.Cheerio): number | undefined {
    // Try different selectors for duration
    const selectors = [
      '.ytd-thumbnail-overlay-time-status-renderer',
      '.video-time',
      '.timestamp'
    ];
    
    for (const selector of selectors) {
      const durationElement = element.find(selector);
      if (durationElement.length) {
        const duration = durationElement.text();
        if (duration) {
          return parseDuration(duration.trim());
        }
      }
    }
    
    return undefined;
  }

  /**
   * Extract item count from search result element
   */
  private extractSearchResultItemCount(element: cheerio.Cheerio): number | undefined {
    // Try different selectors for item count
    const selectors = [
      '.ytd-playlist-video-list-renderer',
      '.stats'
    ];
    
    for (const selector of selectors) {
      const countElement = element.find(selector);
      if (countElement.length) {
        const text = countElement.text();
        if (text) {
          // Try to extract count from text
          const match = text.match(/(\d+)/);
          if (match) {
            return parseInt(match[1], 10);
          }
        }
      }
    }
    
    return undefined;
  }
}
