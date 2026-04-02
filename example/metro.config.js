const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const rootPath = path.resolve(__dirname, '..');

const config = {
  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(rootPath, 'node_modules'),
    ],
  },
  watchFolders: [rootPath],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
