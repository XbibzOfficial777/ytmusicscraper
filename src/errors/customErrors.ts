import { ErrorType } from '@/types/enums';

/**
 * Base error class for YT Music Downloader
 */
export class YTMusicDownloaderError extends Error {
  public readonly type: ErrorType;
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN_ERROR,
    code?: string,
    statusCode?: number,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.type = type;
    this.code = code || this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      stack: this.stack,
    };
  }

  /**
   * Create error from JSON
   */
  static fromJSON(json: Record<string, any>): YTMusicDownloaderError {
    const error = new YTMusicDownloaderError(
      json.message,
      json.type,
      json.code,
      json.statusCode,
      json.details
    );
    error.stack = json.stack;
    return error;
  }
}

/**
 * Error thrown when URL is invalid
 */
export class InvalidURLError extends YTMusicDownloaderError {
  constructor(url: string, details?: Record<string, any>) {
    super(
      `Invalid URL: ${url}`,
      ErrorType.INVALID_URL,
      'INVALID_URL',
      400,
      { url, ...details }
    );
  }
}

/**
 * Error thrown when network request fails
 */
export class NetworkError extends YTMusicDownloaderError {
  constructor(message: string, statusCode?: number, details?: Record<string, any>) {
    super(
      message,
      ErrorType.NETWORK_ERROR,
      'NETWORK_ERROR',
      statusCode,
      details
    );
  }
}

/**
 * Error thrown when parsing fails
 */
export class ParseError extends YTMusicDownloaderError {
  constructor(message: string, details?: Record<string, any>) {
    super(
      message,
      ErrorType.PARSE_ERROR,
      'PARSE_ERROR',
      500,
      details
    );
  }
}

/**
 * Error thrown when download fails
 */
export class DownloadError extends YTMusicDownloaderError {
  constructor(message: string, details?: Record<string, any>) {
    super(
      message,
      ErrorType.DOWNLOAD_ERROR,
      'DOWNLOAD_ERROR',
      500,
      details
    );
  }
}

/**
 * Error thrown when conversion fails
 */
export class ConversionError extends YTMusicDownloaderError {
  constructor(message: string, details?: Record<string, any>) {
    super(
      message,
      ErrorType.CONVERSION_ERROR,
      'CONVERSION_ERROR',
      500,
      details
    );
  }
}

/**
 * Error thrown when file system operation fails
 */
export class FileSystemError extends YTMusicDownloaderError {
  constructor(message: string, details?: Record<string, any>) {
    super(
      message,
      ErrorType.FILE_SYSTEM_ERROR,
      'FILE_SYSTEM_ERROR',
      500,
      details
    );
  }
}

/**
 * Error thrown when authentication fails
 */
export class AuthenticationError extends YTMusicDownloaderError {
  constructor(message: string, details?: Record<string, any>) {
    super(
      message,
      ErrorType.AUTHENTICATION_ERROR,
      'AUTHENTICATION_ERROR',
      401,
      details
    );
  }
}

/**
 * Error thrown when rate limit is exceeded
 */
export class RateLimitError extends YTMusicDownloaderError {
  constructor(message: string, retryAfter?: number, details?: Record<string, any>) {
    super(
      message,
      ErrorType.RATE_LIMIT_ERROR,
      'RATE_LIMIT_ERROR',
      429,
      { retryAfter, ...details }
    );
  }
}
