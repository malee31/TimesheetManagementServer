import * as matchers from "jest-extended";

expect.extend(matchers);

// Configures variables for testing
jest.resetModules();
jest.mock("./config.js", () => ({
	...jest.requireActual("./config.js"),
	TESTING: true,
	ADMIN_KEY: "A-Admin-Key",
	JEST_MODIFIED: true,
	...jest.requireActual("dotenv").config({
		path: "./testing.env"
	}).parsed
}));

afterEach(() => {
	const config = require("./config.js");
	// Ensuring that the main database was not modified
	// If it was modified... oh no... at least you now know it happened
	expect(config.JEST_MODIFIED).toBeTrue();
})