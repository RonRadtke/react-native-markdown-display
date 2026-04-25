module.exports = {
    moduleNameMapper: {
        '^react$': '<rootDir>/node_modules/react',
        '^react-native$': '<rootDir>/node_modules/react-native',
        '^@react-native-vector-icons/material-design-icons$':
            '<rootDir>/__mocks__/MaterialDesignIcons.js',
    },
    preset: 'react-native',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
