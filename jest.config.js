const config = {
	transform: {
		"^.+\\.[t|j]s$": "babel-jest"
	},
	setupFilesAfterEnv: [
		"<rootDir>/jest-setup.js"
	]
};

export default config;