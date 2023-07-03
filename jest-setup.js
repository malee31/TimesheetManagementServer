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

// Note: This beforeAll actually runs once before EVERY FILE, not just once for the entire Jest run
beforeAll(async () => {
	jest.isolateModules(async () => {
		jest.mock("./src/database/database-interface.js");
		let mockedDBI = require("./src/database/database-interface.js");
		await expect(mockedDBI.getAllUsers()).resolves.toBeEmpty()
		mockedDBI.setSampleData();
	});

	let mockedDBI = require("./src/database/database-interface.js");
	console.log("Hi")

	// TODO: Insert all fixture data
});

afterEach(() => {
	const config = require("./config.js");
	// Ensuring that the main database was not modified
	// If it was modified... oh no... at least you now know it happened
	expect(config.JEST_MODIFIED).toBeTrue();
});

afterAll(async () => {
	// TODO: Validate all the inserts to the test tables
	// Note: This line can be moved to the afterEach to determine better which test fails the validation

	// TODO: Drop all tables in test database
});