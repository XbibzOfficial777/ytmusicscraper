import { EventEmitter } from 'eventemitter3';
import { DownloaderConfig } from '@/types/interfaces';
import { AudioFormat, AudioQuality } from '@/types/enums';
import { getFFmpegOptions } from '@/utils/helpers';
import { ConversionError } from '@/errors/customErrors';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { pipeline } from 'stream';
import { createReadStream, createWriteStream } from 'fs';
import { join } from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

/**
 * Audio converter class
 */
export class AudioConverter extends EventEmitter {
  private config: DownloaderConfig;
  private ffmpegPath: string;

  constructor(config: DownloaderConfig) {
    super();
    this.config = config;
    this.ffmpegPath = ffmpegStatic || 'ffmpeg';
    
    // Set FFmpeg path
    ffmpeg.setFfmpegPath(this.ffmpegPath);
  }

  /**
   * Update configuration
   */
  updateConfig(config: DownloaderConfig): void {
    this.config = config;
  }

  /**
   * Convert audio file to specified format and quality
   */
  async convert(
    inputPath: string,
    outputPath: string,
    format: AudioFormat,
    quality: AudioQuality
  ): Promise<string> {
    this.emit('converting', inputPath, outputPath);
    
    try {
      // Get FFmpeg options for format and quality
      const options = getFFmpegOptions(format, quality);
      
      // Create a promise to handle the conversion
      return new Promise<string>((resolve, reject) => {
        // Create FFmpeg command
        const command = ffmpeg(inputPath)
          .outputOptions(...options)
          .format(format)
          .on('start', (commandLine) => {
            this.emit('conversionStart', commandLine);
          })
          .on('progress', (progress) => {
            this.emit('conversionProgress', progress);
          })
          .on('end', () => {
            this.emit('converted', inputPath, outputPath);
            resolve(outputPath);
          })
          .on('error', (error) => {
            this.emit('conversionError', inputPath, outputPath, error);
            reject(new ConversionError(`Failed to convert audio: ${error.message}`));
          });
        
        // Set output path
        command.save(outputPath);
      });
    } catch (error) {
      this.emit('conversionError', inputPath, outputPath, error);
      throw new ConversionError(`Failed to convert audio: ${(error as Error).message}`);
    }
  }

  /**
   * Get audio information
   */
  async getAudioInfo(filePath: string): Promise<any> {
    try {
      return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
          if (err) {
            reject(new ConversionError(`Failed to get audio info: ${err.message}`));
          } else {
            resolve(metadata);
          }
        });
      });
    } catch (error) {
      throw new ConversionError(`Failed to get audio info: ${(error as Error).message}`);
    }
  }

  /**
   * Extract audio from video file
   */
  async extractAudio(
    inputPath: string,
    outputPath: string,
    format: AudioFormat = AudioFormat.MP3,
    quality: AudioQuality = AudioQuality.HIGH
  ): Promise<string> {
    this.emit('extracting', inputPath, outputPath);
    
    try {
      // Get FFmpeg options for format and quality
      const options = getFFmpegOptions(format, quality);
      
      // Create a promise to handle the extraction
      return new Promise<string>((resolve, reject) => {
        // Create FFmpeg command
        const command = ffmpeg(inputPath)
          .noVideo()
          .audioCodec(format === AudioFormat.MP3 ? 'libmp3lame' : 
                      format === AudioFormat.AAC ? 'aac' :
                      format === AudioFormat.FLAC ? 'flac' :
                      format === AudioFormat.OGG ? 'libvorbis' : 'pcm_s16le')
          .outputOptions(...options)
          .format(format)
          .on('start', (commandLine) => {
            this.emit('extractionStart', commandLine);
          })
          .on('progress', (progress) => {
            this.emit('extractionProgress', progress);
          })
          .on('end', () => {
            this.emit('extracted', inputPath, outputPath);
            resolve(outputPath);
          })
          .on('error', (error) => {
            this.emit('extractionError', inputPath, outputPath, error);
            reject(new ConversionError(`Failed to extract audio: ${error.message}`));
          });
        
        // Set output path
        command.save(outputPath);
      });
    } catch (error) {
      this.emit('extractionError', inputPath, outputPath, error);
      throw new ConversionError(`Failed to extract audio: ${(error as Error).message}`);
    }
  }

  /**
   * Merge audio files
   */
  async mergeAudioFiles(
    inputPaths: string[],
    outputPath: string,
    format: AudioFormat = AudioFormat.MP3,
    quality: AudioQuality = AudioQuality.HIGH
  ): Promise<string> {
    this.emit('merging', inputPaths, outputPath);
    
    try {
      // Get FFmpeg options for format and quality
      const options = getFFmpegOptions(format, quality);
      
      // Create a promise to handle the merging
      return new Promise<string>((resolve, reject) => {
        // Create FFmpeg command
        const command = ffmpeg()
          .on('start', (commandLine) => {
            this.emit('mergeStart', commandLine);
          })
          .on('progress', (progress) => {
            this.emit('mergeProgress', progress);
          })
          .on('end', () => {
            this.emit('merged', inputPaths, outputPath);
            resolve(outputPath);
          })
          .on('error', (error) => {
            this.emit('mergeError', inputPaths, outputPath, error);
            reject(new ConversionError(`Failed to merge audio files: ${error.message}`));
          });
        
        // Add input files
        inputPaths.forEach(inputPath => {
          command.input(inputPath);
        });
        
        // Set output options
        command
          .outputOptions(...options)
          .format(format)
          .save(outputPath);
      });
    } catch (error) {
      this.emit('mergeError', inputPaths, outputPath, error);
      throw new ConversionError(`Failed to merge audio files: ${(error as Error).message}`);
    }
  }

  /**
   * Trim audio file
   */
  async trimAudio(
    inputPath: string,
    outputPath: string,
    startTime: number,
    duration: number,
    format: AudioFormat = AudioFormat.MP3,
    quality: AudioQuality = AudioQuality.HIGH
  ): Promise<string> {
    this.emit('trimming', inputPath, outputPath);
    
    try {
      // Get FFmpeg options for format and quality
      const options = getFFmpegOptions(format, quality);
      
      // Create a promise to handle the trimming
      return new Promise<string>((resolve, reject) => {
        // Create FFmpeg command
        const command = ffmpeg(inputPath)
          .seekInput(startTime)
          .duration(duration)
          .outputOptions(...options)
          .format(format)
          .on('start', (commandLine) => {
            this.emit('trimStart', commandLine);
          })
          .on('progress', (progress) => {
            this.emit('trimProgress', progress);
          })
          .on('end', () => {
            this.emit('trimmed', inputPath, outputPath);
            resolve(outputPath);
          })
          .on('error', (error) => {
            this.emit('trimError', inputPath, outputPath, error);
            reject(new ConversionError(`Failed to trim audio: ${error.message}`));
          });
        
        // Set output path
        command.save(outputPath);
      });
    } catch (error) {
      this.emit('trimError', inputPath, outputPath, error);
      throw new ConversionError(`Failed to trim audio: ${(error as Error).message}`);
    }
  }

  /**
   * Adjust audio volume
   */
  async adjustVolume(
    inputPath: string,
    outputPath: string,
    volume: number,
    format: AudioFormat = AudioFormat.MP3,
    quality: AudioQuality = AudioQuality.HIGH
  ): Promise<string> {
    this.emit('adjustingVolume', inputPath, outputPath);
    
    try {
      // Get FFmpeg options for format and quality
      const options = getFFmpegOptions(format, quality);
      
      // Create a promise to handle the volume adjustment
      return new Promise<string>((resolve, reject) => {
        // Create FFmpeg command
        const command = ffmpeg(inputPath)
          .audioFilters(`volume=${volume}`)
          .outputOptions(...options)
          .format(format)
          .on('start', (commandLine) => {
            this.emit('volumeAdjustmentStart', commandLine);
          })
          .on('progress', (progress) => {
            this.emit('volumeAdjustmentProgress', progress);
          })
          .on('end', () => {
            this.emit('volumeAdjusted', inputPath, outputPath);
            resolve(outputPath);
          })
          .on('error', (error) => {
            this.emit('volumeAdjustmentError', inputPath, outputPath, error);
            reject(new ConversionError(`Failed to adjust volume: ${error.message}`));
          });
        
        // Set output path
        command.save(outputPath);
      });
    } catch (error) {
      this.emit('volumeAdjustmentError', inputPath, outputPath, error);
      throw new ConversionError(`Failed to adjust volume: ${(error as Error).message}`);
    }
  }

  /**
   * Fade audio in/out
   */
  async fadeAudio(
    inputPath: string,
    outputPath: string,
    fadeInDuration: number = 0,
    fadeOutDuration: number = 0,
    format: AudioFormat = AudioFormat.MP3,
    quality: AudioQuality = AudioQuality.HIGH
  ): Promise<string> {
    this.emit('fading', inputPath, outputPath);
    
    try {
      // Get FFmpeg options for format and quality
      const options = getFFmpegOptions(format, quality);
      
      // Build audio filters
      const filters: string[] = [];
      if (fadeInDuration > 0) {
        filters.push(`afade=t=in:st=0:d=${fadeInDuration}`);
      }
      if (fadeOutDuration > 0) {
        filters.push(`afade=t=out:st=-${fadeOutDuration}:d=${fadeOutDuration}`);
      }
      
      // Create a promise to handle the fading
      return new Promise<string>((resolve, reject) => {
        // Create FFmpeg command
        const command = ffmpeg(inputPath)
          .audioFilters(filters.join(','))
          .outputOptions(...options)
          .format(format)
          .on('start', (commandLine) => {
            this.emit('fadeStart', commandLine);
          })
          .on('progress', (progress) => {
            this.emit('fadeProgress', progress);
          })
          .on('end', () => {
            this.emit('faded', inputPath, outputPath);
            resolve(outputPath);
          })
          .on('error', (error) => {
            this.emit('fadeError', inputPath, outputPath, error);
            reject(new ConversionError(`Failed to fade audio: ${error.message}`));
          });
        
        // Set output path
        command.save(outputPath);
      });
    } catch (error) {
      this.emit('fadeError', inputPath, outputPath, error);
      throw new ConversionError(`Failed to fade audio: ${(error as Error).message}`);
    }
  }

  /**
   * Normalize audio
   */
  async normalizeAudio(
    inputPath: string,
    outputPath: string,
    format: AudioFormat = AudioFormat.MP3,
    quality: AudioQuality = AudioQuality.HIGH
  ): Promise<string> {
    this.emit('normalizing', inputPath, outputPath);
    
    try {
      // Get FFmpeg options for format and quality
      const options = getFFmpegOptions(format, quality);
      
      // Create a promise to handle the normalization
      return new Promise<string>((resolve, reject) => {
        // Create FFmpeg command
        const command = ffmpeg(inputPath)
          .audioFilters('loudnorm=I=-16:LRA=11:TP=-1.5')
          .outputOptions(...options)
          .format(format)
          .on('start', (commandLine) => {
            this.emit('normalizationStart', commandLine);
          })
          .on('progress', (progress) => {
            this.emit('normalizationProgress', progress);
          })
          .on('end', () => {
            this.emit('normalized', inputPath, outputPath);
            resolve(outputPath);
          })
          .on('error', (error) => {
            this.emit('normalizationError', inputPath, outputPath, error);
            reject(new ConversionError(`Failed to normalize audio: ${error.message}`));
          });
        
        // Set output path
        command.save(outputPath);
      });
    } catch (error) {
      this.emit('normalizationError', inputPath, outputPath, error);
      throw new ConversionError(`Failed to normalize audio: ${(error as Error).message}`);
    }
  }
}
