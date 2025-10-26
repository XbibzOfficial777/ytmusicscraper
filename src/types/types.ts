import { TrackInfo, PlaylistInfo, SearchResult } from './interfaces';

/**
 * Union type for all possible info types
 */
export type InfoType = TrackInfo | PlaylistInfo | SearchResult;

/**
 * Union type for all possible URL types
 */
export type URLType = 'track' | 'playlist' | 'album' | 'unknown';

/**
 * Function to determine URL type
 */
export type URLTypeDetector = (url: string) => URLType;

/**
 * Function to validate URL
 */
export type URLValidator = (url: string) => boolean;

/**
 * Function to format filename
 */
export type FilenameFormatter = (trackInfo: TrackInfo, template?: string) => string;

/**
 * Function to sanitize filename
 */
export type FilenameSanitizer = (filename: string) => string;

/**
 * Function to extract metadata
 */
export type MetadataExtractor = (trackInfo: TrackInfo) => Record<string, any>;

/**
 * Function to convert audio format
 */
export type AudioConverter = (
  inputPath: string,
  outputPath: string,
  format: string,
  quality?: string
) => Promise<string>;

/**
 * Function to write metadata to file
 */
export type MetadataWriter = (
  filePath: string,
  metadata: Record<string, any>
) => Promise<void>;

/**
 * Function to create download progress
 */
export type ProgressCreator = (
  downloaded: number,
  total: number,
  speed: number,
  eta: number
) => import('./interfaces').DownloadProgress;

/**
 * Function to handle errors
 */
export type ErrorHandler = (
  error: Error,
  context?: Record<string, any>
) => import('./interfaces').DownloadResult;

/**
 * Function to retry failed operations
 */
export type RetryFunction = <T>(
  fn: () => Promise<T>,
  attempts: number,
  delay: number
) => Promise<T>;

/**
 * Function to make HTTP requests
 */
export type RequestFunction = <T = any>(
  url: string,
  options?: RequestInit
) => Promise<T>;

/**
 * Function to parse HTML
 */
export type HTMLParser = (html: string) => any;

/**
 * Function to extract video ID from URL
 */
export type VideoIDExtractor = (url: string) => string | null;

/**
 * Function to get video info
 */
export type VideoInfoGetter = (videoId: string) => Promise<any>;

/**
 * Function to download video
 */
export type VideoDownloader = (
  url: string,
  options?: any
) => Promise<import('stream').Readable>;

/**
 * Function to process downloaded video
 */
export type VideoProcessor = (
  inputStream: import('stream').Readable,
  outputPath: string,
  format: string,
  quality?: string
) => Promise<string>;

/**
 * Function to validate file
 */
export type FileValidator = (filePath: string) => Promise<boolean>;

/**
 * Function to get file info
 */
export type FileInfoGetter = (filePath: string) => Promise<{
  size: number;
  format: string;
  duration?: number;
  bitrate?: number;
}>;

/**
 * Function to create directory
 */
export type DirectoryCreator = (dirPath: string) => Promise<void>;

/**
 * Function to check if file exists
 */
export type FileExistsChecker = (filePath: string) => Promise<boolean>;

/**
 * Function to delete file
 */
export type FileDeleter = (filePath: string) => Promise<void>;

/**
 * Function to copy file
 */
export type FileCopier = (sourcePath: string, destPath: string) => Promise<void>;

/**
 * Function to move file
 */
export type FileMover = (sourcePath: string, destPath: string) => Promise<void>;

/**
 * Function to read file
 */
export type FileReader = (filePath: string) => Promise<Buffer>;

/**
 * Function to write file
 */
export type FileWriter = (filePath: string, data: Buffer) => Promise<void>;

/**
 * Function to stream file
 */
export type FileStreamer = (filePath: string) => import('stream').Readable;

/**
 * Function to compress file
 */
export type FileCompressor = (
  inputPath: string,
  outputPath: string,
  options?: any
) => Promise<string>;

/**
 * Function to decompress file
 */
export type FileDecompressor = (
  inputPath: string,
  outputPath: string,
  options?: any
) => Promise<string>;

/**
 * Function to hash file
 */
export type FileHasher = (filePath: string, algorithm: string) => Promise<string>;

/**
 * Function to compare files
 */
export type FileComparator = (filePath1: string, filePath2: string) => Promise<boolean>;

/**
 * Function to get file stats
 */
export type FileStatsGetter = (filePath: string) => Promise<{
  size: number;
  created: Date;
  modified: Date;
  accessed: Date;
  isFile: boolean;
  isDirectory: boolean;
}>;

/**
 * Function to watch file changes
 */
export type FileWatcher = (
  filePath: string,
  callback: (eventType: string, filename: string) => void
) => () => void;
