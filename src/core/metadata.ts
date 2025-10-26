import { TrackInfo } from '@/types/interfaces';
import { AudioFormat } from '@/types/enums';
import { FileSystemError } from '@/errors/customErrors';
import NodeID3 from 'node-id3';
import { promises as fs } from 'fs';

/**
 * Metadata writer class
 */
export class MetadataWriter {
  /**
   * Write metadata to audio file
   */
  async writeMetadata(filePath: string, trackInfo: TrackInfo): Promise<void> {
    try {
      // Check if file exists
      await fs.access(filePath);
      
      // Get file extension
      const extension = filePath.split('.').pop()?.toLowerCase();
      
      // Write metadata based on file format
      switch (extension) {
        case 'mp3':
          await this.writeID3Metadata(filePath, trackInfo);
          break;
        case 'flac':
          await this.writeFLACMetadata(filePath, trackInfo);
          break;
        case 'm4a':
        case 'aac':
          await this.writeMP4Metadata(filePath, trackInfo);
          break;
        case 'ogg':
          await this.writeVorbisMetadata(filePath, trackInfo);
          break;
        default:
          // Skip metadata writing for unsupported formats
          console.warn(`Metadata writing not supported for format: ${extension}`);
      }
    } catch (error) {
      throw new FileSystemError(`Failed to write metadata: ${(error as Error).message}`);
    }
  }

  /**
   * Write ID3 metadata for MP3 files
   */
  private async writeID3Metadata(filePath: string, trackInfo: TrackInfo): Promise<void> {
    try {
      // Create ID3 tags
      const tags: NodeID3.Tags = {
        title: trackInfo.title,
        artist: trackInfo.artist,
        album: trackInfo.album,
        year: trackInfo.year?.toString(),
        trackNumber: trackInfo.trackNumber?.toString(),
        genre: trackInfo.genre,
        image: trackInfo.thumbnail ? {
          mime: 'image/jpeg',
          type: {
            id: 3,
            name: 'front cover'
          },
          description: 'Cover',
          imageBuffer: await this.downloadImage(trackInfo.thumbnail)
        } : undefined
      };
      
      // Write tags to file
      const success = NodeID3.update(tags, filePath);
      
      if (!success) {
        throw new Error('Failed to write ID3 tags');
      }
    } catch (error) {
      throw new FileSystemError(`Failed to write ID3 metadata: ${(error as Error).message}`);
    }
  }

  /**
   * Write FLAC metadata
   */
  private async writeFLACMetadata(filePath: string, trackInfo: TrackInfo): Promise<void> {
    // FLAC metadata writing would require a specific library
    // This is a placeholder implementation
    console.warn('FLAC metadata writing not implemented yet');
  }

  /**
   * Write MP4 metadata for M4A/AAC files
   */
  private async writeMP4Metadata(filePath: string, trackInfo: TrackInfo): Promise<void> {
    // MP4 metadata writing would require a specific library
    // This is a placeholder implementation
    console.warn('MP4 metadata writing not implemented yet');
  }

  /**
   * Write Vorbis metadata for OGG files
   */
  private async writeVorbisMetadata(filePath: string, trackInfo: TrackInfo): Promise<void> {
    // Vorbis metadata writing would require a specific library
    // This is a placeholder implementation
    console.warn('Vorbis metadata writing not implemented yet');
  }

  /**
   * Download image from URL
   */
  private async downloadImage(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }
      
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      throw new Error(`Failed to download image: ${(error as Error).message}`);
    }
  }
}
