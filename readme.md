<div align="center">

[![loho mmk](https://github.com/Habibzz01/XbibzAssets-/releases/download/Nexo444/ytmusicscrap.png)](https://youtube.com/@XbibzOfficial)

# 🎵 YT Music Downloader

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000" />
  <img src="https://img.shields.io/badge/node-%3E%3D14.0.0-green.svg" />
  <img src="https://img.shields.io/badge/license-MIT-yellow.svg" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" />
</p>

<p align="center">
  <strong>A powerful, feature-rich library to download, scrape, and manage music from YouTube Music</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-documentation">Documentation</a> •
  <a href="#-examples">Examples</a>
</p>

</div>

---

## ✨ Features

<table>
<tr>
<td width="33%" align="center">
<img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/download.svg" width="50" height="50" style="filter: invert(42%) sepia(93%) saturate(1352%) hue-rotate(200deg) brightness(100%) contrast(101%);">
<h3>🎯 Smart Downloads</h3>
<p>Download tracks, playlists, and albums with intelligent retry mechanisms and parallel processing</p>
</td>
<td width="33%" align="center">
<img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/sliders.svg" width="50" height="50" style="filter: invert(42%) sepia(93%) saturate(1352%) hue-rotate(200deg) brightness(100%) contrast(101%);">
<h3>⚙️ Highly Configurable</h3>
<p>Multiple audio formats (MP3, FLAC, WAV, AAC, OGG) with customizable quality settings</p>
</td>
<td width="33%" align="center">
<img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/tags.svg" width="50" height="50" style="filter: invert(42%) sepia(93%) saturate(1352%) hue-rotate(200deg) brightness(100%) contrast(101%);">
<h3>🏷️ Auto Metadata</h3>
<p>Automatically writes ID3 tags including title, artist, album, year, and cover art</p>
</td>
</tr>
<tr>
<td width="33%" align="center">
<img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/plug.svg" width="50" height="50" style="filter: invert(42%) sepia(93%) saturate(1352%) hue-rotate(200deg) brightness(100%) contrast(101%);">
<h3>🔌 Plugin System</h3>
<p>Extensible architecture with middleware and plugin support for custom workflows</p>
</td>
<td width="33%" align="center">
<img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/magnifying-glass.svg" width="50" height="50" style="filter: invert(42%) sepia(93%) saturate(1352%) hue-rotate(200deg) brightness(100%) contrast(101%);">
<h3>🔍 Search Integration</h3>
<p>Built-in search functionality to find songs, albums, and playlists</p>
</td>
<td width="33%" align="center">
<img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/gauge-high.svg" width="50" height="50" style="filter: invert(42%) sepia(93%) saturate(1352%) hue-rotate(200deg) brightness(100%) contrast(101%);">
<h3>📊 Progress Tracking</h3>
<p>Real-time progress callbacks with detailed download statistics</p>
</td>
</tr>
</table>

---

## 📦 Installation

```bash
# Using npm
npm install @xbibzlibrary/ytmusicscraper

# Using yarn
yarn add @xbibzlibrary/ytmusicscraper

# Using pnpm
pnpm add @xbibzlibrary/ytmusicscraper
```

### Prerequisites

<div style="background: #f6f8fa; padding: 15px; border-radius: 6px; border-left: 4px solid #0969da;">

**Required:**
- Node.js >= 14.0.0
- FFmpeg (for audio conversion)

**Install FFmpeg:**
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg

# Windows (using Chocolatey)
choco install ffmpeg
```

</div>

---

## 🚀 Quick Start

### Basic Usage

```typescript
import { downloadTrack, downloadPlaylist } from '@xbibzlibrary/ytmusicscraper';

// Download a single track
const result = await downloadTrack('https://music.youtube.com/watch?v=VIDEO_ID');

if (result.success) {
  console.log(`✅ Downloaded: ${result.filePath}`);
} else {
  console.error(`❌ Failed: ${result.error}`);
}

// Download a playlist
const playlistResult = await downloadPlaylist('https://music.youtube.com/playlist?list=PLAYLIST_ID');

console.log(`📥 Downloaded ${playlistResult.successful}/${playlistResult.total} tracks`);
```

### Advanced Usage

```typescript
import { YTMusicDownloader, AudioFormat, AudioQuality } from '@xbibzlibrary/ytmusicscraper';

const downloader = new YTMusicDownloader({
  outputDir: './my-music',
  quality: AudioQuality.HIGHEST,
  format: AudioFormat.MP3,
  metadata: true,
  parallelDownloads: 5,
  progressCallback: (progress) => {
    console.log(`Progress: ${progress.percent}% | Speed: ${progress.speed} KB/s`);
  }
});

// Download with custom settings
const result = await downloader.downloadTrack('YOUTUBE_MUSIC_URL');
```

---

## 📚 Documentation

### Configuration Options

<details>
<summary><strong>Click to expand configuration table</strong></summary>

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `outputDir` | `string` | `./downloads` | Directory to save downloaded files |
| `quality` | `AudioQuality` | `HIGH` | Audio quality (LOWEST, LOW, MEDIUM, HIGH, HIGHEST) |
| `format` | `AudioFormat` | `MP3` | Output format (MP3, WAV, FLAC, AAC, OGG) |
| `metadata` | `boolean` | `true` | Write metadata tags to files |
| `parallelDownloads` | `number` | `3` | Number of simultaneous downloads |
| `retryAttempts` | `number` | `3` | Number of retry attempts for failed downloads |
| `retryDelay` | `number` | `1000` | Delay between retries (ms) |
| `timeout` | `number` | `30000` | Request timeout (ms) |
| `overwrite` | `boolean` | `false` | Overwrite existing files |
| `filenameTemplate` | `string` | `{artist} - {title}` | Custom filename template |
| `progressCallback` | `function` | - | Progress tracking callback |

</details>

### Audio Quality & Format

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">

<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; color: white;">

**🎚️ Quality Levels**

- `LOWEST` - 64 kbps
- `LOW` - 128 kbps
- `MEDIUM` - 192 kbps
- `HIGH` - 256 kbps
- `HIGHEST` - 320 kbps

</div>

<div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 10px; color: white;">

**🎵 Supported Formats**

- `MP3` - Most compatible
- `FLAC` - Lossless quality
- `WAV` - Uncompressed
- `AAC` - Apple standard
- `OGG` - Open source

</div>

</div>

---

## 🎯 Core Methods

### `downloadTrack(url, options?)`

Download a single track from YouTube Music.

```typescript
const result = await downloader.downloadTrack('YOUTUBE_MUSIC_URL', {
  quality: AudioQuality.HIGHEST,
  format: AudioFormat.FLAC
});
```

**Returns:** `Promise<DownloadResult>`

---

### `downloadPlaylist(url, options?)`

Download an entire playlist.

```typescript
const result = await downloader.downloadPlaylist('PLAYLIST_URL', {
  parallelDownloads: 5,
  progressCallback: (progress) => {
    console.log(`${progress.percent}% complete`);
  }
});
```

**Returns:** `Promise<BatchDownloadResult>`

---

### `getTrackInfo(url)`

Get track metadata without downloading.

```typescript
const trackInfo = await downloader.getTrackInfo('YOUTUBE_MUSIC_URL');

console.log(`
  Title: ${trackInfo.title}
  Artist: ${trackInfo.artist}
  Duration: ${trackInfo.duration}s
`);
```

**Returns:** `Promise<TrackInfo>`

---

### `search(options)`

Search for music on YouTube.

```typescript
const results = await downloader.search({
  query: 'Bohemian Rhapsody',
  maxResults: 10,
  type: SearchType.SONG
});

results.forEach(result => {
  console.log(`${result.title} - ${result.url}`);
});
```

**Returns:** `Promise<SearchResult[]>`

---

## 💡 Examples

### Example 1: Batch Download with Progress

<div style="background: #0d1117; padding: 20px; border-radius: 8px; border: 1px solid #30363d;">

```typescript
import { YTMusicDownloader, AudioFormat, AudioQuality } from '@xbibzlibrary/ytmusicscraper';

const urls = [
  'https://music.youtube.com/watch?v=VIDEO_1',
  'https://music.youtube.com/watch?v=VIDEO_2',
  'https://music.youtube.com/watch?v=VIDEO_3'
];

const downloader = new YTMusicDownloader({
  outputDir: './my-music',
  quality: AudioQuality.HIGH,
  format: AudioFormat.MP3,
  progressCallback: (progress) => {
    const bar = '█'.repeat(Math.floor(progress.percent / 2));
    const empty = '░'.repeat(50 - Math.floor(progress.percent / 2));
    console.log(`[${bar}${empty}] ${progress.percent}%`);
  }
});

// Download all tracks
const results = await Promise.all(
  urls.map(url => downloader.downloadTrack(url))
);

console.log(`✅ Success: ${results.filter(r => r.success).length}`);
console.log(`❌ Failed: ${results.filter(r => !r.success).length}`);
```

</div>

### Example 2: Using Middleware

<div style="background: #0d1117; padding: 20px; border-radius: 8px; border: 1px solid #30363d;">

```typescript
const downloader = new YTMusicDownloader();

// Log all downloads
downloader.use(async (trackInfo, next) => {
  console.log(`📥 Downloading: ${trackInfo.title} by ${trackInfo.artist}`);
  const result = await next();
  console.log(`${result.success ? '✅' : '❌'} ${trackInfo.title}`);
  return result;
});

// Filter by duration
downloader.use(async (trackInfo, next) => {
  if (trackInfo.duration < 120) {
    return {
      success: false,
      error: 'Track too short (< 2 minutes)'
    };
  }
  return next();
});

// Filter explicit content
downloader.use(async (trackInfo, next) => {
  if (trackInfo.explicit) {
    return {
      success: false,
      error: 'Explicit content filtered'
    };
  }
  return next();
});

const result = await downloader.downloadTrack('YOUTUBE_MUSIC_URL');
```

</div>

### Example 3: Custom Plugin

<div style="background: #0d1117; padding: 20px; border-radius: 8px; border: 1px solid #30363d;">

```typescript
// Create a notification plugin
const notificationPlugin = {
  name: 'Notifier',
  version: '1.0.0',
  init: (downloader) => {
    console.log('🔔 Notification plugin loaded');
  },
  beforeDownload: async (trackInfo) => {
    console.log(`🎵 Starting download: ${trackInfo.title}`);
  },
  afterDownload: async (result) => {
    if (result.success) {
      console.log(`✅ Download complete: ${result.trackInfo?.title}`);
      // Send system notification
      // sendNotification(`Downloaded: ${result.trackInfo?.title}`);
    }
  },
  onError: async (error, trackInfo) => {
    console.error(`❌ Error: ${error.message}`);
    // Send error notification
    // sendErrorNotification(error.message);
  }
};

downloader.addPlugin(notificationPlugin);
```

</div>

### Example 4: Event Listeners

<div style="background: #0d1117; padding: 20px; border-radius: 8px; border: 1px solid #30363d;">

```typescript
const downloader = new YTMusicDownloader();

// Listen to all events
downloader.on('scraping', (url) => {
  console.log(`🔍 Scraping: ${url}`);
});

downloader.on('scraped', (url, data) => {
  console.log(`✅ Scraped: ${url}`);
});

downloader.on('converting', (input, output) => {
  console.log(`🔄 Converting: ${input} -> ${output}`);
});

downloader.on('converted', (input, output) => {
  console.log(`✅ Converted: ${output}`);
});

downloader.on('downloadComplete', (result) => {
  console.log(`🎉 Download complete: ${result.filePath}`);
});

downloader.on('downloadError', (error) => {
  console.error(`💥 Download error: ${error.message}`);
});
```

</div>

---

## 🔧 How It Works

<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 15px; color: white; margin: 20px 0;">

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    YTMusicDownloader                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────┐ │
│  │ Scraper  │→│  Parser  │→│ Converter │→│ Metadata │ │
│  └──────────┘  └──────────┘  └───────────┘  └──────────┘ │
│       ↓             ↓              ↓              ↓        │
│  [Fetch HTML]  [Extract]    [FFmpeg]    [ID3 Tags]       │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │              Plugin & Middleware System               │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Process Flow

1. **🔍 URL Validation** - Validates and parses YouTube Music URLs
2. **📡 Web Scraping** - Fetches page content using axios
3. **🔎 Data Parsing** - Extracts track info using cheerio
4. **⬇️ Download** - Downloads audio using ytdl-core
5. **🔄 Conversion** - Converts to desired format using FFmpeg
6. **🏷️ Metadata** - Writes ID3 tags using node-id3
7. **✅ Complete** - Returns result with file path

</div>

---

## 🎨 TypeScript Support

Full TypeScript support with comprehensive type definitions!

```typescript
import {
  YTMusicDownloader,
  DownloaderConfig,
  TrackInfo,
  PlaylistInfo,
  DownloadResult,
  BatchDownloadResult,
  AudioFormat,
  AudioQuality,
  DownloadStatus,
  Plugin,
  MiddlewareFunction
} from '@xbibzlibrary/ytmusicscraper';

// All types are fully typed and documented
const config: DownloaderConfig = {
  outputDir: './music',
  quality: AudioQuality.HIGHEST,
  format: AudioFormat.FLAC
};

const downloader = new YTMusicDownloader(config);
```

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0;">

<div style="background: #238636; padding: 15px; border-radius: 8px; color: white; text-align: center;">
<strong>🐛 Report Bugs</strong>
<br>Found a bug? Open an issue!
</div>

<div style="background: #1f6feb; padding: 15px; border-radius: 8px; color: white; text-align: center;">
<strong>✨ Suggest Features</strong>
<br>Have an idea? We'd love to hear it!
</div>

<div style="background: #8957e5; padding: 15px; border-radius: 8px; color: white; text-align: center;">
<strong>📝 Improve Docs</strong>
<br>Help make the docs better!
</div>

<div style="background: #da3633; padding: 15px; border-radius: 8px; color: white; text-align: center;">
<strong>🔧 Submit PRs</strong>
<br>Code contributions welcome!
</div>

</div>

### Development Setup

```bash
# Clone the repository
git clone https://github.com/XbibzOfficial777/@xbibzlibrary/ytmusicscraper.git

# Install dependencies
npm install

# Run tests
npm test

# Build the project
npm run build

# Watch mode for development
npm run dev
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

<div style="background: #f6f8fa; padding: 20px; border-radius: 8px; border-left: 4px solid #0969da;">

- **ytdl-core** - YouTube video downloading
- **FFmpeg** - Audio/video processing
- **cheerio** - HTML parsing
- **node-id3** - ID3 tag writing

</div>

---

## ⚠️ Disclaimer

<div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; color: #856404;">

This tool is for educational purposes only. Please respect copyright laws and YouTube's Terms of Service. The authors are not responsible for any misuse of this software.

**Important:**
- Only download content you have the rights to
- Respect artists and content creators
- Don't use this for commercial purposes without permission

</div>

---

## 📞 Support

<div align="center">

<h3>Need Help?</h3>

<p>
  <a href="https://github.com/XbibzOfficial777/@xbibzlibrary/ytmusicscraper/issues">
    <img src="https://img.shields.io/badge/GitHub-Issues-red?style=for-the-badge&logo=github" alt="GitHub Issues">
  </a>
  <a href="https://github.com/XbibzOfficial777/@xbibzlibrary/ytmusicscraper/discussions">
    <img src="https://img.shields.io/badge/GitHub-Discussions-blue?style=for-the-badge&logo=github" alt="GitHub Discussions">
  </a>
</p>

<p style="margin-top: 30px;">
  <strong>Made with ❤️ by <a href="https://tiktok.com/@xbibzofficiall">Xbibz Official</a></strong>
</p>

[![Suki](https://github.com/Habibzz01/XbibzAssets-/releases/download/Nexo444/mylogobulat.png)](https://xbibzofficial.netlify.app)

<p>
  ⭐ Star this repository if you find it helpful!
</p>

</div>

---

<div align="center">

### 🚀 Happy Downloading! 🎵

[![GitHub stars](https://img.shields.io/github/stars/XbibzOfficial777/@xbibzlibrary/ytmusicscraper?style=social)](https://github.com/XbibzOfficial/@xbibzlibrary/ytmusicscraper/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/XbibzOfficial777/@xbibzlibrary/ytmusicscraper?style=social)](https://github.com/XbibzOfficial/@xbibzlibrary/ytmusicscraper/network/members)
[![GitHub watchers](https://img.shields.io/github/watchers/XbibzOfficial777/@xbibzlibrary/ytmusicscraper?style=social)](https://github.com/XbibzOfficial/@xbibzlibrary/ytmusicscraper/watchers)

</div>
