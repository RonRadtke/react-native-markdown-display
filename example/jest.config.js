module.exports = {
  moduleNameMapper: {
    '^react$': '<rootDir>/node_modules/react',
    '^react-native$': '<rootDir>/node_modules/react-native',
  },
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
