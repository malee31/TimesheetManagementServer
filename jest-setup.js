import * as matchers from "jest-extended";
import * as testUtils from "./testUtils.js";

global._utils = testUtils;

expect.extend(matchers);

// Note: beforeAll actually runs once before EVERY FILE, not just once for the entire Jest run
// These before/afterEach run for EVERY test so don't make it *too* expensive to run. Just write  sanity/smoke checks
beforeEach(async () => {
	expect(require("./config.js").TESTING).toBeTrue();
	await jest.isolateModulesAsync(async () => {
		jest.resetModules();
		jest.mock("./src/database/database-interface.js");
		let mockedDBI = require("./src/database/database-interface.js");

		// TODO: Consider using database.js directly instead
		await expect(mockedDBI.getAllUsers()).resolves.toBeEmpty()
		mockedDBI.setSampleData();
		// TODO: Figure out what is even going on here with isolation
		jest.resetModules();
	});
});

afterEach(async () => {
	// Ensuring that the main database was not modified
	// If it was modified... oh no... at least you now know it happened
	expect(require("./config.js").TESTING).toBeTrue();

	// TODO: Validate all the inserts to the test tables
	// Note: This validation can be moved to afterAll or even global teardown if it increases run time too much

	// Take down the database connections for the test
	const database = require("./src/database/database.js");
	await database.default.end();
});
