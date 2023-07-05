import * as matchers from "jest-extended";

expect.extend(matchers);

// Note: This beforeAll actually runs once before EVERY FILE, not just once for the entire Jest run
beforeAll(async () => {
	expect(require("./config.js").TESTING).toBeTrue();
	await jest.isolateModulesAsync(async () => {
		jest.mock("./src/database/database-interface.js");
		let mockedDBI = require("./src/database/database-interface.js");
		await expect(mockedDBI.getAllUsers()).resolves.toBeEmpty()
		mockedDBI.setSampleData();
	});

	let mockedDBI = require("./src/database/database-interface.js");
	console.log("TODO: Breakpoint here")

	// TODO: Insert all fixture data
});

afterEach(() => {
	const config = require("./config.js");
	// Ensuring that the main database was not modified
	// If it was modified... oh no... at least you now know it happened
	expect(require("./config.js").TESTING).toBeTrue();
});

afterAll(async () => {
	// TODO: Validate all the inserts to the test tables
	// Note: This line can be moved to the afterEach to determine better which test fails the validation

	// TODO: Drop all tables in test database
});