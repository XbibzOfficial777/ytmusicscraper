import { Parser } from '../../src/core/parser';
import { ParseError } from '../../src/errors/customErrors';
import * as cheerio from 'cheerio';

describe('Parser', () => {
  let parser: Parser;
  
  beforeEach(() => {
    parser = new Parser();
  });
  
  describe('Cheerio Sanity Check', () => {
    it('should be able to load HTML and find an element', () => {
      const html = '<div><span class="test-span">Hello</span></div>';
      const $ = (cheerio.load as any)(html);
      const text = $('.test-span').text();
      expect(text).toBe('Hello');
    });
  });

  describe('parsePlaylistInfo', () => {
    it('should parse playlist info successfully', () => {
      const mockHtml = `
        <html>
          <head>
            <title>Test Playlist - YouTube</title>
            <meta property="og:title" content="Test Playlist">
            <meta property="og:image" content="https://img.youtube.com/vi/playlist-id/maxresdefault.jpg">
          </head>
          <body>
            <h1 class="pl-header-title">Test Playlist</h1>
            <div class="pl-header-details">10 songs</div>
            <div class="pl-header-details">
              <li>
                <a href="/channel/test-channel">Test Channel</a>
              </li>
            </div>
            
              <div class="pl-video">
                <a href="/watch?v=test-id-1">Test Track 1</a>
                <div class="pl-video-owner">Test Artist</div>
                <div class="pl-video-time">3:45</div>
              </div>
              <div class="pl-video">
                <a href="/watch?v=test-id-2">Test Track 2</a>
                <div class="pl-video-owner">Test Artist</div>
                <div class="pl-video-time">4:20</div>
              </div>
          </body>
        </html>
      `;
      
      const result = parser.parsePlaylistInfo(mockHtml, 'playlist-id');
      
      expect(result.id).toBe('playlist-id');
      expect(result.title).toBe('Test Playlist');
      expect(result.trackCount).toBe(10);
      expect(result.channelName).toBe('Test Channel');
      expect(result.url).toBe('https://www.youtube.com/playlist?list=playlist-id');
      expect(result.tracks).toHaveLength(2);
      
      expect(result.tracks[0].id).toBe('test-id-1');
      expect(result.tracks[0].title).toBe('Test Track 1');
      expect(result.tracks[0].artist).toBe('Test Artist');
      expect(result.tracks[0].duration).toBe(225);
      
      expect(result.tracks[1].id).toBe('test-id-2');
      expect(result.tracks[1].title).toBe('Test Track 2');
      expect(result.tracks[1].artist).toBe('Test Artist');
      expect(result.tracks[1].duration).toBe(260);
    });
    
    it('should handle missing playlist title', () => {
      const mockHtml = '<html><body>No playlist title here</body></html>';
      
      expect(() => parser.parsePlaylistInfo(mockHtml, 'playlist-id')).toThrow(ParseError);
    });
    
    it('should handle missing track count', () => {
      const mockHtml = `
        <html>
          <head>
            <title>Test Playlist - YouTube</title>
          </head>
          <body>
            <h1 class="pl-header-title">Test Playlist</h1>
          </body>
        </html>
      `;
      
      expect(() => parser.parsePlaylistInfo(mockHtml, 'playlist-id')).toThrow(ParseError);
    });
  });
  
  describe('parseSearchResults', () => {
    it('should parse search results successfully', () => {
      const mockHtml = `
        <html>
          <body>
            <div class="ytd-video-renderer">
              <a id="video-title" href="/watch?v=test-id-1">Test Video 1</a>
              <div class="ytd-thumbnail-overlay-time-status-renderer">3:45</div>
              <img src="https://img.youtube.com/vi/test-id-1/default.jpg" />
            </div>
            <div class="ytd-playlist-renderer">
              <a id="playlist-title" href="/playlist?list=playlist-id-1">Test Playlist 1</a>
              <div class="stats">10 videos</div>
              <img src="https://img.youtube.com/vi/playlist-id-1/default.jpg" />
            </div>
          </body>
        </html>
      `;
      
      const options = {
        query: 'test query',
        maxResults: 10
      };
      
      const results = parser.parseSearchResults(mockHtml, options);
      
      expect(results).toHaveLength(2);
      
      expect(results[0].type).toBe('video');
      expect(results[0].id).toBe('test-id-1');
      expect(results[0].title).toBe('Test Video 1');
      expect(results[0].url).toBe('https://www.youtube.com/watch?v=test-id-1');
      expect(results[0].duration).toBe(225);
      expect(results[0].thumbnail).toBe('https://img.youtube.com/vi/test-id-1/default.jpg');
      
      expect(results[1].type).toBe('playlist');
      expect(results[1].id).toBe('playlist-id-1');
      expect(results[1].title).toBe('Test Playlist 1');
      expect(results[1].url).toBe('https://www.youtube.com/playlist?list=playlist-id-1');
      expect(results[1].itemCount).toBe(10);
      expect(results[1].thumbnail).toBe('https://img.youtube.com/vi/playlist-id-1/default.jpg');
    });
    
    it('should limit results when maxResults is specified', () => {
      const mockHtml = `
        <html>
          <body>
            <div class="ytd-video-renderer">
              <a id="video-title" href="/watch?v=test-id-1">Test Video 1</a>
            </div>
            <div class="ytd-video-renderer">
              <a id="video-title" href="/watch?v=test-id-2">Test Video 2</a>
            </div>
            <div class="ytd-video-renderer">
              <a id="video-title" href="/watch?v=test-id-3">Test Video 3</a>
            </div>
          </body>
        </html>
      `;
      
      const options = {
        query: 'test query',
        maxResults: 2
      };
      
      const results = parser.parseSearchResults(mockHtml, options);
      
      expect(results).toHaveLength(2);
    });
  });
});
