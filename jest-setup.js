// Configures variables for testing
jest.resetModules();
jest.mock("./config.js", () => ({
	...jest.requireActual("./config.js"),
	TESTING: true,
	ADMIN_KEY: "A-Admin-Key",
	...jest.requireActual("dotenv").config({
		path: "./testing.env"
	}).parsed
}));