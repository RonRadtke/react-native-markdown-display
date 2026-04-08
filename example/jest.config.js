module.exports = {
    moduleNameMapper: {
        '^react$': '<rootDir>/node_modules/react',
        '^react-native$': '<rootDir>/node_modules/react-native',
        '^@react-native-vector-icons/material-icons$':
            '<rootDir>/__mocks__/MaterialIcons.js',
    },
    preset: 'react-native',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
