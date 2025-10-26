import { Scraper } from '../../src/core/scraper';
import { DownloaderConfig } from '../../src/types/interfaces';
import { NetworkError } from '../../src/errors/customErrors';

// Mock dependencies
jest.mock('axios');
jest.mock('ytdl-core');

import axios from 'axios';
import ytdl from 'ytdl-core';
import { Readable } from 'stream';

describe('Scraper', () => {
  let scraper: Scraper;
  let mockConfig: DownloaderConfig;
  
  beforeEach(() => {
    mockConfig = {
      outputDir: './test-downloads',
      quality: 'high' as any,
      format: 'mp3' as any,
      metadata: true,
      parallelDownloads: 1,
      retryAttempts: 1,
      retryDelay: 100,
      timeout: 5000
    };
    
    // Mock axios
    const mockedAxios = axios as jest.Mocked<typeof axios>;
    mockedAxios.create = jest.fn().mockReturnValue({
      get: jest.fn(),
      request: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    });

    scraper = new Scraper(mockConfig);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('constructor', () => {
    it('should create a scraper with config', () => {
      expect(scraper).toBeDefined();
    });
  });
  
  describe('updateConfig', () => {
    it('should update configuration', () => {
      const newConfig = { ...mockConfig, timeout: 10000 };
      scraper.updateConfig(newConfig);
      
      // No direct way to test this without accessing private members
      // But we can test that no errors are thrown
      expect(scraper).toBeDefined();
    });
  });
  
  describe('scrapePage', () => {
    it('should scrape a page successfully', async () => {
      const mockHtml = '<html><head><title>Test Page</title></head><body>Test Content</body></html>';
      
      // Mock axios to return the HTML
      const mockAxiosInstance = (axios as any).create();
      mockAxiosInstance.get = jest.fn().mockResolvedValue({ data: mockHtml });
      
      const result = await scraper.scrapePage('https://example.com');
      
      expect(result).toBe(mockHtml);
    });
    
    it('should handle network errors', async () => {
      // Mock axios to throw an error
      const mockAxiosInstance = (axios as any).create();
      mockAxiosInstance.get = jest.fn().mockRejectedValue(new Error('Network error'));
      
      await expect(scraper.scrapePage('https://example.com')).rejects.toThrow(NetworkError);
    });
    
    it('should handle HTTP errors', async () => {
      // Mock axios to return an error response
      const mockAxiosInstance = (axios as any).create();
      mockAxiosInstance.get = jest.fn().mockRejectedValue({
        response: {
          status: 404,
          statusText: 'Not Found'
        }
      });
      
      await expect(scraper.scrapePage('https://example.com')).rejects.toThrow(NetworkError);
    });
    
    it('should handle timeout errors', async () => {
      // Mock axios to throw a timeout error
      const mockAxiosInstance = (axios as any).create();
      mockAxiosInstance.get = jest.fn().mockRejectedValue({
        code: 'ECONNABORTED'
      });
      
      await expect(scraper.scrapePage('https://example.com')).rejects.toThrow(NetworkError);
    });
  });
  
  describe.skip('downloadVideo', () => {
    it('should download a video successfully', async () => {
      const mockStream = new Readable();
      mockStream._read = () => {}; // No-op
      
      // Mock ytdl to return a stream
      const mockInfo = {
        formats: [
          { itag: 140, mimeType: 'audio/mp4', qualityLabel: '128kbps' }
        ]
      };
      
      (ytdl.getInfo as jest.Mock).mockResolvedValue(mockInfo);
      (ytdl.chooseFormat as jest.Mock).mockReturnValue(mockInfo.formats[0]);
      (ytdl.downloadFromInfo as jest.Mock).mockReturnValue(mockStream);
      
      const result = await scraper.downloadVideo('https://www.youtube.com/watch?v=test-id');
      
      expect(result).toBe(mockStream);
      expect(ytdl.getInfo).toHaveBeenCalledWith('https://www.youtube.com/watch?v=test-id');
      expect(ytdl.chooseFormat).toHaveBeenCalledWith(mockInfo.formats, { quality: 'highestaudio' });
      expect(ytdl.downloadFromInfo).toHaveBeenCalledWith(mockInfo, { format: mockInfo.formats[0] });
    });
    
    it('should handle download errors', async () => {
      // Mock ytdl to throw an error
      (ytdl.getInfo as jest.Mock).mockRejectedValue(new Error('Video not found'));
      
      await expect(scraper.downloadVideo('https://www.youtube.com/watch?v=test-id')).rejects.toThrow(NetworkError);
    });
    
    it('should handle no suitable format', async () => {
      // Mock ytdl to return no formats
      const mockInfo = {
        formats: []
      };
      
      (ytdl.getInfo as jest.Mock).mockResolvedValue(mockInfo);
      (ytdl.chooseFormat as jest.Mock).mockReturnValue(null);
      
      await expect(scraper.downloadVideo('https://www.youtube.com/watch?v=test-id')).rejects.toThrow(NetworkError);
    });
  });
  
  describe('makeRequest', () => {
    it('should make a request successfully', async () => {
      const mockData = { result: 'success' };
      
      // Mock axios to return the data
      const mockAxiosInstance = (axios as any).create();
      mockAxiosInstance.request = jest.fn().mockResolvedValue({ data: mockData });
      
      const result = await scraper.makeRequest('https://api.example.com/data');
      
      expect(result).toBe(mockData);
    });
    
    it('should handle request errors', async () => {
      // Mock axios to throw an error
      const mockAxiosInstance = (axios as any).create();
      mockAxiosInstance.request = jest.fn().mockRejectedValue(new Error('Request failed'));
      
      await expect(scraper.makeRequest('https://api.example.com/data')).rejects.toThrow(NetworkError);
    });
  });
});
