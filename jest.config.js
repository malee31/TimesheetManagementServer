const config = {
	transform: {
		"^.+\\.[t|j]s$": "babel-jest"
	},
	globalSetup: "<rootDir>/jest-global-setup.js",
	globalTeardown: "<rootDir>/jest-global-teardown.js",
	setupFilesAfterEnv: [
		"<rootDir>/jest-setup.js"
	],
	// Increases default timeout to 30 seconds since running all tests in parallel hammers the connection pool
	testTimeout: 30000
};

export default config;