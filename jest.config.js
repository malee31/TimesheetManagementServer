const config = {
	transform: {
		"^.+\\.[t|j]s$": "babel-jest"
	},
	globalSetup: "<rootDir>/jest-global-setup.js",
	globalTeardown: "<rootDir>/jest-global-teardown.js",
	setupFilesAfterEnv: [
		"<rootDir>/jest-setup.js"
	],
	// These tests tend to perform worse or hang/fail when run after others so they are isolated and run with `npm run manual-tests`
	testPathIgnorePatterns: ["<rootDir>/src/manual-tests/.*.test.js"],
	maxWorkers: "50%",
	// Increases default timeout to 30 seconds since running all tests in parallel hammers the connection pool
	testTimeout: 30000
};

export default config;