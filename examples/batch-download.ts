import { YTMusicDownloader, AudioFormat, AudioQuality } from '../src/index';
import { promises as fs } from 'fs';

// Batch download from a list of URLs
async function batchDownloadFromList() {
  // Read URLs from a file
  const urls = await fs.readFile('urls.txt', 'utf8');
  const urlList = urls.split('\n').filter(url => url.trim());
  
  // Create downloader
  const downloader = new YTMusicDownloader({
    outputDir: './batch-downloads',
    quality: AudioQuality.HIGH,
    format: AudioFormat.MP3,
    parallelDownloads: 3,
    progressCallback: (progress) => {
      console.log(`Progress: ${progress.percent}%`);
    }
  });
  
  // Add event listeners
  downloader.on('downloadComplete', (result) => {
    console.log(`✓ Downloaded: ${result.trackInfo?.title}`);
  });
  
  downloader.on('downloadError', (error, trackInfo) => {
    console.error(`✗ Failed to download: ${trackInfo?.title} - ${error.message}`);
  });
  
  // Download all tracks
  const results = await Promise.all(
    urlList.map(url => downloader.downloadTrack(url))
  );
  
  // Count successful downloads
  const successful = results.filter(result => result.success).length;
  console.log(`Downloaded ${successful} out of ${urlList.length} tracks`);
}

// Batch download from a playlist with filtering
async function batchDownloadWithFilter() {
  const downloader = new YTMusicDownloader({
    outputDir: './filtered-downloads',
    quality: AudioQuality.HIGH,
    format: AudioFormat.MP3,
    parallelDownloads: 3
  });
  
  // Add middleware to filter tracks
  downloader.use(async (trackInfo, next) => {
    // Skip tracks shorter than 2 minutes
    if (trackInfo.duration < 120) {
      console.log(`Skipping short track: ${trackInfo.title} (${trackInfo.duration}s)`);
      return {
        success: false,
        error: 'Track too short',
        trackInfo
      };
    }
    
    // Skip tracks with explicit content
    if (trackInfo.explicit) {
      console.log(`Skipping explicit track: ${trackInfo.title}`);
      return {
        success: false,
        error: 'Explicit content',
        trackInfo
      };
    }
    
    return next();
  });
  
  // Get playlist info first
  const playlistUrl = 'https://music.youtube.com/playlist?list=PLAYLIST_ID';
  const playlistInfo = await downloader.getPlaylistInfo(playlistUrl);
  
  console.log(`Playlist: ${playlistInfo.title}`);
  console.log(`Total tracks: ${playlistInfo.trackCount}`);
  
  // Download playlist
  const result = await downloader.downloadPlaylist(playlistUrl);
  
  console.log(`Downloaded ${result.successful} out of ${result.total} tracks`);
  console.log(`Filtered out ${result.failed} tracks`);
}

// Batch download with retry logic
async function batchDownloadWithRetry() {
  const downloader = new YTMusicDownloader({
    outputDir: './retry-downloads',
    quality: AudioQuality.HIGH,
    format: AudioFormat.MP3,
    parallelDownloads: 2,
    retryAttempts: 5,
    retryDelay: 2000
  });
  
  // Add plugin to handle retries
  downloader.addPlugin({
    name: 'RetryHandler',
    version: '1.0.0',
    init: () => {
      console.log('Retry handler plugin initialized');
    },
    onError: async (error, trackInfo) => {
      if (trackInfo) {
        console.log(`Error downloading ${trackInfo.title}, will retry if possible`);
      }
    }
  });
  
  // URLs to download
  const urls = [
    'https://music.youtube.com/watch?v=VIDEO_ID_1',
    'https://music.youtube.com/watch?v=VIDEO_ID_2',
    'https://music.youtube.com/watch?v=VIDEO_ID_3'
  ];
  
  // Download all URLs
  const results = await Promise.all(
    urls.map(url => downloader.downloadTrack(url))
  );
  
  // Check results
  results.forEach((result, index) => {
    if (result.success) {
      console.log(`✓ ${urls[index]}: ${result.filePath}`);
    } else {
      console.error(`✗ ${urls[index]}: ${result.error}`);
    }
  });
}

// Run examples
batchDownloadFromList();
batchDownloadWithFilter();
batchDownloadWithRetry();
