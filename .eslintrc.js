module.exports = {
  extends: '@react-native-community',
  settings: {
      react: {
          version: require('./package.json').peerDependencies.react,
      },
  }
};
