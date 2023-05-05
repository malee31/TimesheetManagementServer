const config = {
	transform: {
		"^.+\\.[t|j]s$": "babel-jest"
	},
	globalSetup: "<rootDir>/jest-setup.js",
	setupFilesAfterEnv: ["<rootDir>/jest-extend.js"]
};

export default config;