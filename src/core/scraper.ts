import { EventEmitter } from 'eventemitter3';
import { DownloaderConfig } from '@/types/interfaces';
import { DEFAULT_HEADERS, API_ENDPOINTS } from '@/utils/constants';
import { withTimeout, retry } from '@/utils/helpers';
import { NetworkError, RateLimitError } from '@/errors/customErrors';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

import { Readable } from 'stream';

/**
 * Scraper class for downloading YouTube content
 */
export class Scraper extends EventEmitter {
  private config: DownloaderConfig;
  private axiosInstance: any;

  constructor(config: DownloaderConfig) {
    super();
    this.config = config;
    this.setupAxios();
  }

  /**
   * Update configuration
   */
  updateConfig(config: DownloaderConfig): void {
    this.config = config;
    this.setupAxios();
  }

  /**
   * Scrape a web page
   */
  async scrapePage(url: string): Promise<string> {
    this.emit('scraping', url);
    
    try {
      const response: AxiosResponse = await withTimeout(
        this.axiosInstance.get(url),
        this.config.timeout || 30000
      );
      
      this.emit('scraped', url, response.data);
      return response.data;
    } catch (error) {
      const axiosError = error as any;
      
      if (axiosError.response) {
        const status = axiosError.response.status;
        
        if (status === 429) {
          const retryAfter = axiosError.response.headers['retry-after'];
          throw new RateLimitError(
            'Rate limit exceeded',
            retryAfter ? parseInt(retryAfter, 10) : undefined
          );
        }
        
        throw new NetworkError(
          `HTTP error ${status}: ${axiosError.response.statusText}`,
          status
        );
      } else if (axiosError.code === 'ECONNABORTED') {
        throw new NetworkError('Request timeout');
      } else {
        throw new NetworkError(`Network error: ${axiosError.message}`);
      }
    }
  }

  /**
   * Download video as stream
   */
  async downloadVideo(url: string): Promise<Readable> {
    throw new Error('ytdl-core functionality is temporarily disabled due to persistent TypeScript errors.');
  }

  /**
   * Make a generic API request
   */
  async makeRequest<T = any>(
    url: string,
    options: AxiosRequestConfig = {}
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await withTimeout(
        this.axiosInstance.request({ url, ...options }),
        this.config.timeout || 30000
      );
      
      return response.data;
    } catch (error) {
      const axiosError = error as any;
      
      if (axiosError.response) {
        const status = axiosError.response.status;
        
        if (status === 429) {
          const retryAfter = axiosError.response.headers['retry-after'];
          throw new RateLimitError(
            'Rate limit exceeded',
            retryAfter ? parseInt(retryAfter, 10) : undefined
          );
        }
        
        throw new NetworkError(
          `HTTP error ${status}: ${axiosError.response.statusText}`,
          status
        );
      } else if (axiosError.code === 'ECONNABORTED') {
        throw new NetworkError('Request timeout');
      } else {
        throw new NetworkError(`Network error: ${axiosError.message}`);
      }
    }
  }

  /**
   * Set up Axios instance with configuration
   */
  private setupAxios(): void {
    const headers = {
      ...DEFAULT_HEADERS,
      ...(this.config.headers || {})
    };
    
    const axiosConfig: AxiosRequestConfig = {
      headers,
      timeout: this.config.timeout || 30000,
    };
    
    // Add proxy configuration if provided
    if (this.config.proxy) {
      const { host, port, protocol = 'http', auth } = this.config.proxy;
      
      axiosConfig.proxy = {
        host,
        port,
        protocol,
      };
      
      if (auth) {
        axiosConfig.proxy.auth = {
          username: auth.username,
          password: auth.password,
        };
      }
    }
    
    this.axiosInstance = axios.create(axiosConfig);
    
    // Add request interceptor for logging
    this.axiosInstance.interceptors.request.use(
      (config: AxiosRequestConfig) => {
        this.emit('request', config);
        return config;
      },
      (error: any) => {
        this.emit('requestError', error);
        return Promise.reject(error);
      }
    );
    
    // Add response interceptor for logging and error handling
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        this.emit('response', response);
        return response;
      },
      (error: any) => {
        this.emit('responseError', error);
        return Promise.reject(error);
      }
    );
  }
}
