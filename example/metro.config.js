const fs = require('fs');
const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const rootPath = path.resolve(__dirname, '..');
const appNodeModulesPath = path.resolve(__dirname, 'node_modules');
const rootNodeModulesPath = path.resolve(rootPath, 'node_modules');
const exclusionList = require(path.resolve(
    __dirname,
    'node_modules/metro-config/src/defaults/exclusionList.js',
)).default;

const escapeRegExp = (value) => value.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&');

const resolveModulePath = (moduleName) => {
    const appModulePath = path.resolve(appNodeModulesPath, moduleName);

    if (fs.existsSync(appModulePath)) {
        return appModulePath;
    }

    return path.resolve(rootNodeModulesPath, moduleName);
};

const config = {
    resolver: {
        blockList: exclusionList([
            new RegExp(`^${escapeRegExp(path.resolve(rootNodeModulesPath, 'react'))}\\/.*$`),
            new RegExp(
                `^${escapeRegExp(path.resolve(rootNodeModulesPath, 'react-native'))}\\/.*$`,
            ),
        ]),
        disableHierarchicalLookup: true,
        extraNodeModules: new Proxy(
            {},
            {
                get: (_target, moduleName) =>
                    resolveModulePath(String(moduleName)),
            },
        ),
        nodeModulesPaths: [appNodeModulesPath, rootNodeModulesPath],
    },
    watchFolders: [rootPath],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
