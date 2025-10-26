import { YTMusicDownloader, AudioFormat, AudioQuality } from '../../src/index';
import { promises as fs } from 'fs';
import { join } from 'path';

// These tests require actual YouTube URLs and will make real network requests
// They should be run manually and not as part of CI/CD

describe('End-to-End Tests', () => {
  let downloader: YTMusicDownloader;
  const testOutputDir = './test-downloads';
  
  beforeAll(async () => {
    // Create test output directory
    try {
      await fs.mkdir(testOutputDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
    
    downloader = new YTMusicDownloader({
      outputDir: testOutputDir,
      quality: AudioQuality.MEDIUM,
      format: AudioFormat.MP3,
      metadata: true,
      parallelDownloads: 1,
      retryAttempts: 2,
      retryDelay: 1000
    });
  });
  
  afterAll(async () => {
    // Clean up test output directory
    try {
      const files = await fs.readdir(testOutputDir);
      await Promise.all(
        files.map(file => fs.unlink(join(testOutputDir, file)))
      );
      await fs.rmdir(testOutputDir);
    } catch (error) {
      // Directory might not exist or be empty
    }
  });
  
  // These tests are disabled by default to avoid making real network requests
  // To run them, change 'describe.skip' to 'describe' and provide valid YouTube URLs
  
  describe.skip('Track Download', () => {
    it('should download a track successfully', async () => {
      // Replace with a valid YouTube Music URL
      const trackUrl = 'https://music.youtube.com/watch?v=VIDEO_ID';
      
      const result = await downloader.downloadTrack(trackUrl);
      
      expect(result.success).toBe(true);
      expect(result.filePath).toBeDefined();
      expect(result.trackInfo).toBeDefined();
      
      // Check if file exists
      const fileExists = await fs.access(result.filePath!).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);
    });
    
    it('should handle invalid URLs', async () => {
      const invalidUrl = 'https://example.com/invalid-url';
      
      const result = await downloader.downloadTrack(invalidUrl);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
  
  describe.skip('Playlist Download', () => {
    it('should download a playlist successfully', async () => {
      // Replace with a valid YouTube Music playlist URL
      const playlistUrl = 'https://music.youtube.com/playlist?list=PLAYLIST_ID';
      
      const result = await downloader.downloadPlaylist(playlistUrl);
      
      expect(result.total).toBeGreaterThan(0);
      expect(result.successful).toBeGreaterThan(0);
      expect(result.results).toHaveLength(result.total);
      
      // Check if files exist
      for (const trackResult of result.results) {
        if (trackResult.success) {
          const fileExists = await fs.access(trackResult.filePath!).then(() => true).catch(() => false);
          expect(fileExists).toBe(true);
        }
      }
    });
    
    it('should handle invalid playlist URLs', async () => {
      const invalidUrl = 'https://example.com/invalid-playlist';
      
      const result = await downloader.downloadPlaylist(invalidUrl);
      
      expect(result.total).toBe(0);
      expect(result.successful).toBe(0);
      expect(result.failed).toBe(1);
    });
  });
  
  describe.skip('Track Info', () => {
    it('should get track info successfully', async () => {
      // Replace with a valid YouTube Music URL
      const trackUrl = 'https://music.youtube.com/watch?v=VIDEO_ID';
      
      const trackInfo = await downloader.getTrackInfo(trackUrl);
      
      expect(trackInfo.id).toBeDefined();
      expect(trackInfo.title).toBeDefined();
      expect(trackInfo.artist).toBeDefined();
      expect(trackInfo.duration).toBeGreaterThan(0);
      expect(trackInfo.url).toBe(trackUrl);
    });
  });
  
  describe.skip('Playlist Info', () => {
    it('should get playlist info successfully', async () => {
      // Replace with a valid YouTube Music playlist URL
      const playlistUrl = 'https://music.youtube.com/playlist?list=PLAYLIST_ID';
      
      const playlistInfo = await downloader.getPlaylistInfo(playlistUrl);
      
      expect(playlistInfo.id).toBeDefined();
      expect(playlistInfo.title).toBeDefined();
      expect(playlistInfo.trackCount).toBeGreaterThan(0);
      expect(playlistInfo.url).toBe(playlistUrl);
      expect(playlistInfo.tracks).toHaveLength(playlistInfo.trackCount);
    });
  });
  
  describe.skip('Search', () => {
    it('should search for music successfully', async () => {
      const searchOptions = {
        query: 'test song',
        maxResults: 5,
        type: 'song' as any
      };
      
      const results = await downloader.search(searchOptions);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(5);
      
      for (const result of results) {
        expect(result.id).toBeDefined();
        expect(result.title).toBeDefined();
        expect(result.url).toBeDefined();
      }
    });
  });
});
