/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['<rootDir>/__test__/**/*.test.ts'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    transform: {
        '^.+\\.[jt]sx?$': [
            'ts-jest',
            {
                tsconfig: '<rootDir>/tsconfig.jest.json'
            }
        ]
    }
};
