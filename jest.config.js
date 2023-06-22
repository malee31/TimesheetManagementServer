const config = {
	transform: {
		"^.+\\.[t|j]s$": "babel-jest"
	},
	setupFilesAfterEnv: [
		"<rootDir>/jest-extend.js",
		"<rootDir>/jest-setup.js"
	]
};

export default config;