import { YTMusicDownloader, AudioFormat, AudioQuality } from '../src/index';

// Advanced usage with custom configuration
async function advancedDownload() {
  // Create downloader with custom configuration
  const downloader = new YTMusicDownloader({
    outputDir: './my-music',
    quality: AudioQuality.HIGHEST,
    format: AudioFormat.FLAC,
    metadata: true,
    parallelDownloads: 5,
    retryAttempts: 5,
    progressCallback: (progress) => {
      console.log(`Download progress: ${progress.percent}%`);
    }
  });
  
  // Add event listeners
  downloader.on('downloadStart', (trackInfo) => {
    console.log(`Starting download: ${trackInfo.title} by ${trackInfo.artist}`);
  });
  
  downloader.on('downloadComplete', (result) => {
    console.log(`Download complete: ${result.filePath}`);
  });
  
  downloader.on('downloadError', (error, trackInfo) => {
    console.error(`Download error for ${trackInfo?.title}: ${error.message}`);
  });
  
  try {
    // Download a track with progress tracking
    const result = await downloader.downloadTrack('https://music.youtube.com/watch?v=VIDEO_ID');
    
    if (result.success) {
      console.log(`Track downloaded: ${result.filePath}`);
    } else {
      console.error(`Download failed: ${result.error}`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Advanced usage with middleware
async function middlewareExample() {
  const downloader = new YTMusicDownloader();
  
  // Add middleware to log download attempts
  downloader.use(async (trackInfo, next) => {
    console.log(`Attempting to download: ${trackInfo.title}`);
    const result = await next();
    console.log(`Download result: ${result.success ? 'Success' : 'Failed'}`);
    return result;
  });
  
  // Add middleware to filter explicit content
  downloader.use(async (trackInfo, next) => {
    if (trackInfo.explicit) {
      console.log(`Skipping explicit track: ${trackInfo.title}`);
      return {
        success: false,
        error: 'Explicit content filtered'
      };
    }
    return next();
  });
  
  try {
    const result = await downloader.downloadTrack('https://music.youtube.com/watch?v=VIDEO_ID');
    console.log('Final result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Advanced usage with plugins
async function pluginExample() {
  const downloader = new YTMusicDownloader();
  
  // Add a simple logging plugin
  downloader.addPlugin({
    name: 'Logger',
    version: '1.0.0',
    init: (downloader) => {
      console.log('Logger plugin initialized');
    },
    beforeDownload: async (trackInfo) => {
      console.log(`About to download: ${trackInfo.title}`);
    },
    afterDownload: async (result) => {
      if (result.success) {
        console.log(`Successfully downloaded: ${result.filePath}`);
      } else {
        console.error(`Download failed: ${result.error}`);
      }
    },
    onError: async (error, trackInfo) => {
      console.error(`Error downloading ${trackInfo?.title}: ${error.message}`);
    }
  });
  
  try {
    const result = await downloader.downloadTrack('https://music.youtube.com/watch?v=VIDEO_ID');
    console.log('Final result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run examples
advancedDownload();
middlewareExample();
pluginExample();
