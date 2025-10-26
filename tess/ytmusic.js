#!/usr/bin/env node

/**
 * 🎵 YouTube Music Downloader - All-in-One Script (CommonJS Version)
 * 
 * PRASYARAT:
 * 1. Node.js (versi 14 atau lebih tinggi)
 * 2. FFmpeg harus terinstall di sistem Anda
 * 
 * INSTALASI LIBRARY:
 * npm install @xbibzlibrary/ytmusicscraper commander
 * 
 * PENTING: Versi ini menggunakan CommonJS (require), bukan ES Modules (import).
 *          Pastikan package.json TIDAK memiliki baris "type": "module".
 */

// --- IMPORTS (Menggunakan require) ---
// PERBAIKAN: Langsung menunjuk ke file index.js yang benar
const { YTMusicDownloader, AudioFormat, AudioQuality } = require('@xbibzlibrary/ytmusicscraper');
const { program } = require('commander');

// --- KELAS APLIKASI UTAMA ---
class YTDownloaderApp {
    constructor() {
        this.downloader = new YTMusicDownloader({
            outputDir: './downloads',
            quality: AudioQuality.HIGH,
            format: AudioFormat.MP3,
            metadata: true,
            parallelDownloads: 3,
            retryAttempts: 3,
            retryDelay: 1000,
            timeout: 30000,
            overwrite: false,
            filenameTemplate: '{artist} - {title}',
            progressCallback: (progress) => this.showProgress(progress)
        });
        this.setupEventListeners();
        this.setupMiddleware();
        this.setupPlugins();
    }

    async downloadTrack(url, options = {}) {
        try {
            console.log(`\n🎵 Memulai download lagu tunggal: ${url}`);
            const customDownloader = new YTMusicDownloader({
                outputDir: options.output || this.downloader.config.outputDir,
                quality: options.quality ? AudioQuality[options.quality.toUpperCase()] : this.downloader.config.quality,
                format: options.format ? AudioFormat[options.format.toUpperCase()] : this.downloader.config.format,
                metadata: true,
                progressCallback: (progress) => this.showProgress(progress)
            });
            const result = await customDownloader.downloadTrack(url);
            this.handleResult(result);
        } catch (error) {
            console.error(`💥 Error tak terduga: ${error.message}`);
        }
    }

    async downloadPlaylist(url, options = {}) {
        try {
            console.log(`\n📥 Memulai download playlist: ${url}`);
            const result = await this.downloader.downloadPlaylist(url);
            console.log(`\n📊 Ringkasan Download Playlist:`);
            console.log(`✅ Berhasil: ${result.successful}`);
            console.log(`❌ Gagal: ${result.failed}`);
            console.log(`📁 Total: ${result.total}`);
        } catch (error) {
            console.error(`💥 Error pada playlist: ${error.message}`);
        }
    }

    async search(query, maxResults = 10) {
        try {
            console.log(`\n🔍 Mencari: "${query}"`);
            const results = await this.downloader.search({ query, maxResults, type: 'song' });
            if (results.length === 0) { console.log('Tidak ada hasil ditemukan.'); return; }
            console.log(`\n📜 Hasil Pencarian:`);
            results.forEach((result, index) => {
                console.log(`\n${index + 1}. ${result.title}`);
                console.log(`   Artis: ${result.artist}`);
                console.log(`   Album: ${result.album || 'N/A'}`);
                console.log(`   Durasi: ${result.duration ? `${Math.floor(result.duration / 60)}:${(result.duration % 60).toString().padStart(2, '0')}` : 'N/A'}`);
                console.log(`   URL: ${result.url}`);
            });
        } catch (error) {
            console.error(`❌ Error pencarian: ${error.message}`);
        }
    }

    async getTrackInfo(url) {
        try {
            console.log(`\n📋 Mengambil info lagu...`);
            const info = await this.downloader.getTrackInfo(url);
            console.log(`\n📄 Informasi Lagu:`);
            console.log(`   Judul: ${info.title}`);
            console.log(`   Artis: ${info.artist}`);
            console.log(`   Album: ${info.album || 'N/A'}`);
            console.log(`   Durasi: ${info.duration ? `${Math.floor(info.duration / 60)}:${(info.duration % 60).toString().padStart(2, '0')}` : 'N/A'}`);
            console.log(`   Tahun: ${info.year || 'N/A'}`);
            console.log(`   Ekspilit: ${info.isExplicit ? 'Ya' : 'Tidak'}`);
        } catch (error) {
            console.error(`❌ Error mengambil info: ${error.message}`);
        }
    }

    showProgress(progress) {
        const bar = '█'.repeat(Math.floor(progress.percent / 2));
        const empty = '░'.repeat(50 - Math.floor(progress.percent / 2));
        process.stdout.write(`\r[${bar}${empty}] ${progress.percent}% | ${progress.speed || 'N/A'} KB/s`);
    }

    handleResult(result) {
        console.log('\n');
        if (result.success) {
            console.log(`✅ Download Berhasil!`);
            console.log(`📁 Lokasi: ${result.filePath}`);
        } else {
            console.error(`❌ Download Gagal: ${result.error}`);
        }
    }

    setupEventListeners() {
        this.downloader.on('scraping', (url) => { console.log(`🔍 Mengambil data dari: ${url}`); });
        this.downloader.on('downloadError', (error) => { /* Error handled in handleResult */ });
    }

    setupMiddleware() {
        this.downloader.use(async (trackInfo, next) => {
            console.log(`\n📥 Memproses: ${trackInfo.title} oleh ${trackInfo.artist}`);
            return await next();
        });
        this.downloader.use(async (trackInfo, next) => {
            if (trackInfo.duration && trackInfo.duration < 30) {
                return { success: false, error: 'Lagu terlalu pendek (< 30 detik), dilewati.' };
            }
            return await next();
        });
    }

    setupPlugins() {
        const notificationPlugin = {
            name: 'ConsoleNotifier', version: '1.0.0', init: () => {},
            beforeDownload: async (trackInfo) => {},
            afterDownload: async (result) => {},
            onError: async (error, trackInfo) => {}
        };
        this.downloader.addPlugin(notificationPlugin);
    }
}

// --- SETUP CLI ---
const app = new YTDownloaderApp();

program
    .name('yt-downloader')
    .description('CLI untuk mendownload musik dari YouTube Music')
    .version('1.0.0');

program
    .command('download <url>')
    .description('Download lagu tunggal atau playlist')
    .option('-f, --format <format>', 'Format audio (mp3, flac, wav, aac, ogg)', 'mp3')
    .option('-q, --quality <quality>', 'Kualitas audio (lowest, low, medium, high, highest)', 'high')
    .option('-o, --output <dir>', 'Direktori output', './downloads')
    .action(async (url, options) => {
        if (url.includes('playlist')) {
            await app.downloadPlaylist(url, options);
        } else {
            await app.downloadTrack(url, options);
        }
    });

program
    .command('search <query>')
    .description('Cari musik di YouTube')
    .option('-n, --number <number>', 'Jumlah hasil pencarian', '10')
    .action(async (query, options) => {
        await app.search(query, parseInt(options.number));
    });

program
    .command('info <url>')
    .description('Dapatkan informasi lagu tanpa mendownload')
    .action(async (url) => {
        await app.getTrackInfo(url);
    });

program.parse();
