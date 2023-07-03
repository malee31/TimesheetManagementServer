const config = {
	transform: {
		"^.+\\.[t|j]s$": "babel-jest"
	},
	globalSetup: "<rootDir>/jest-global-setup.js",
	globalTeardown: "<rootDir>/jest-global-teardown.js",
	setupFilesAfterEnv: [
		"<rootDir>/jest-setup.js"
	]
};

export default config;