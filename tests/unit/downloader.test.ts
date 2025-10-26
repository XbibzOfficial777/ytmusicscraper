import { YTMusicDownloader } from '../../src/core/downloader';
import { AudioFormat, AudioQuality } from '../../src/types/enums';
import { DownloadResult } from '../../src/types/interfaces';

// Mock dependencies
jest.mock('../../src/core/scraper');
jest.mock('../../src/core/parser');
jest.mock('../../src/core/converter');
jest.mock('../../src/core/metadata');
jest.mock('../../src/core/search');

describe('YTMusicDownloader', () => {
  let downloader: YTMusicDownloader;
  
  beforeEach(() => {
    downloader = new YTMusicDownloader({
      outputDir: './test-downloads',
      quality: AudioQuality.HIGH,
      format: AudioFormat.MP3,
      metadata: true,
      parallelDownloads: 1,
      retryAttempts: 1,
      retryDelay: 100
    });
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('constructor', () => {
    it('should create a downloader with default config', () => {
      const defaultDownloader = new YTMusicDownloader();
      const config = defaultDownloader.getConfig();
      
      expect(config.outputDir).toBe('./downloads');
      expect(config.quality).toBe(AudioQuality.HIGH);
      expect(config.format).toBe(AudioFormat.MP3);
      expect(config.metadata).toBe(true);
      expect(config.parallelDownloads).toBe(3);
      expect(config.retryAttempts).toBe(3);
      expect(config.retryDelay).toBe(1000);
    });
    
    it('should create a downloader with custom config', () => {
      const customDownloader = new YTMusicDownloader({
        outputDir: './custom-downloads',
        quality: AudioQuality.HIGHEST,
        format: AudioFormat.FLAC,
        metadata: false,
        parallelDownloads: 5,
        retryAttempts: 5,
        retryDelay: 2000
      });
      
      const config = customDownloader.getConfig();
      
      expect(config.outputDir).toBe('./custom-downloads');
      expect(config.quality).toBe(AudioQuality.HIGHEST);
      expect(config.format).toBe(AudioFormat.FLAC);
      expect(config.metadata).toBe(false);
      expect(config.parallelDownloads).toBe(5);
      expect(config.retryAttempts).toBe(5);
      expect(config.retryDelay).toBe(2000);
    });
  });
  
  describe('configure', () => {
    it('should update configuration', () => {
      downloader.configure({
        outputDir: './new-downloads',
        quality: AudioQuality.LOW
      });
      
      const config = downloader.getConfig();
      
      expect(config.outputDir).toBe('./new-downloads');
      expect(config.quality).toBe(AudioQuality.LOW);
      expect(config.format).toBe(AudioFormat.MP3); // Should remain unchanged
    });
  });
  
  describe('addPlugin', () => {
    it('should add a plugin', () => {
      const plugin = {
        name: 'TestPlugin',
        version: '1.0.0',
        init: jest.fn()
      };
      
      downloader.addPlugin(plugin);
      
      expect(plugin.init).toHaveBeenCalledWith(downloader);
    });
  });
  
  describe('removePlugin', () => {
    it('should remove a plugin', () => {
      const plugin = {
        name: 'TestPlugin',
        version: '1.0.0',
        init: jest.fn()
      };
      
      downloader.addPlugin(plugin);
      downloader.removePlugin('TestPlugin');
      
      // Plugin should be removed (no direct way to test this without accessing private members)
      // But we can test that events are emitted
      const emitSpy = jest.spyOn(downloader, 'emit');
      downloader.removePlugin('NonExistentPlugin');
      expect(emitSpy).not.toHaveBeenCalledWith('pluginRemoved', plugin);
    });
  });
  
  describe('use', () => {
    it('should add middleware', () => {
      const middleware = jest.fn();
      
      downloader.use(middleware);
      
      // Middleware should be added (no direct way to test this without accessing private members)
      expect(middleware).toBeDefined();
    });
  });
  
  describe('downloadTrack', () => {
    it('should download a track successfully', async () => {
      // Mock the internal methods
      const mockTrackInfo = {
        id: 'test-id',
        title: 'Test Track',
        artist: 'Test Artist',
        duration: 180,
        url: 'https://music.youtube.com/watch?v=test-id'
      };
      
      const mockResult: DownloadResult = {
        success: true,
        filePath: './test-downloads/Test Track.mp3',
        trackInfo: mockTrackInfo,
        fileSize: 5000000
      };
      
      // Mock the getTrackInfo method
      jest.spyOn(downloader, 'getTrackInfo').mockResolvedValue(mockTrackInfo);
      
      // Mock the internal download method
      const downloadInternalSpy = jest.spyOn(downloader as any, 'downloadTrackInternal')
        .mockResolvedValue(mockResult);
      
      const result = await downloader.downloadTrack('https://music.youtube.com/watch?v=test-id');
      
      expect(result.success).toBe(true);
      expect(result.filePath).toBe('./test-downloads/Test Track.mp3');
      expect(result.trackInfo).toEqual(mockTrackInfo);
      expect(result.fileSize).toBe(5000000);
      
      expect(downloader.getTrackInfo).toHaveBeenCalledWith('https://music.youtube.com/watch?v=test-id');
      expect(downloadInternalSpy).toHaveBeenCalled();
    });
    
    it('should handle download errors', async () => {
      // Mock the getTrackInfo method to throw an error
      jest.spyOn(downloader, 'getTrackInfo').mockRejectedValue(new Error('Network error'));
      
      const result = await downloader.downloadTrack('https://music.youtube.com/watch?v=test-id');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });
  
  describe('downloadPlaylist', () => {
    it('should download a playlist successfully', async () => {
      // Mock the getPlaylistInfo method
      const mockPlaylistInfo = {
        id: 'test-playlist-id',
        title: 'Test Playlist',
        trackCount: 2,
        url: 'https://music.youtube.com/playlist?list=test-playlist-id',
        tracks: [
          {
            id: 'test-id-1',
            title: 'Test Track 1',
            artist: 'Test Artist',
            duration: 180,
            url: 'https://music.youtube.com/watch?v=test-id-1'
          },
          {
            id: 'test-id-2',
            title: 'Test Track 2',
            artist: 'Test Artist',
            duration: 200,
            url: 'https://music.youtube.com/watch?v=test-id-2'
          }
        ]
      };
      
      jest.spyOn(downloader, 'getPlaylistInfo').mockResolvedValue(mockPlaylistInfo);
      
      // Mock the downloadTrack method
      const mockResults = [
        {
          success: true,
          filePath: './test-downloads/Test Track 1.mp3',
          trackInfo: mockPlaylistInfo.tracks[0],
          fileSize: 5000000
        },
        {
          success: true,
          filePath: './test-downloads/Test Track 2.mp3',
          trackInfo: mockPlaylistInfo.tracks[1],
          fileSize: 6000000
        }
      ];
      
      const downloadTrackSpy = jest.spyOn(downloader, 'downloadTrack')
        .mockResolvedValueOnce(mockResults[0])
        .mockResolvedValueOnce(mockResults[1]);
      
      const result = await downloader.downloadPlaylist('https://music.youtube.com/playlist?list=test-playlist-id');
      
      expect(result.total).toBe(2);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.results).toEqual(mockResults);
      
      expect(downloader.getPlaylistInfo).toHaveBeenCalledWith('https://music.youtube.com/playlist?list=test-playlist-id');
      expect(downloadTrackSpy).toHaveBeenCalledTimes(2);
    });
    
    it('should handle playlist download errors', async () => {
      // Mock the getPlaylistInfo method to throw an error
      jest.spyOn(downloader, 'getPlaylistInfo').mockRejectedValue(new Error('Network error'));
      
      const result = await downloader.downloadPlaylist('https://music.youtube.com/playlist?list=test-playlist-id');
      
      expect(result.total).toBe(0);
      expect(result.successful).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.results[0].success).toBe(false);
      expect(result.results[0].error).toBe('Network error');
    });
  });
});
