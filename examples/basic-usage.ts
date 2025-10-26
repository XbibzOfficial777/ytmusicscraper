import { downloadTrack, downloadPlaylist } from '../src/index';

// Basic usage - download a single track
async function downloadSingleTrack() {
  try {
    const result = await downloadTrack('https://music.youtube.com/watch?v=VIDEO_ID');
    
    if (result.success) {
      console.log(`Track downloaded successfully: ${result.filePath}`);
      console.log(`File size: ${result.fileSize} bytes`);
    } else {
      console.error(`Download failed: ${result.error}`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Basic usage - download a playlist
async function downloadMusicPlaylist() {
  try {
    const result = await downloadPlaylist('https://music.youtube.com/playlist?list=PLAYLIST_ID');
    
    console.log(`Downloaded ${result.successful} out of ${result.total} tracks`);
    console.log(`Total time: ${result.totalTime}ms`);
    
    // Show results for each track
    result.results.forEach((trackResult, index) => {
      if (trackResult.success) {
        console.log(`Track ${index + 1}: ${trackResult.filePath}`);
      } else {
        console.error(`Track ${index + 1} failed: ${trackResult.error}`);
      }
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run examples
downloadSingleTrack();
downloadMusicPlaylist();
