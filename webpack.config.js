const path = require('path');
const nodeExternals = require('webpack-node-externals');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './src/index.ts',
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    target: 'node',
    externals: [nodeExternals()],
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@/core': path.resolve(__dirname, 'src/core'),
        '@/utils': path.resolve(__dirname, 'src/utils'),
        '@/types': path.resolve(__dirname, 'src/types'),
        '@/errors': path.resolve(__dirname, 'src/errors')
      }
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      library: 'YTMusicDownloader',
      libraryTarget: 'umd',
      globalObject: 'this',
      clean: true,
    },
    optimization: {
      minimize: isProduction,
      usedExports: true,
      sideEffects: false,
    },
    plugins: [
      ...(isProduction ? [
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: 'stats.json'
        })
      ] : [])
    ],
    stats: {
      colors: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false
    }
  };
};
