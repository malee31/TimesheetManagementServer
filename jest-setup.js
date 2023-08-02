import * as matchers from "jest-extended";
import * as testUtils from "./src/utils/testUtils.js";
import database from "./src/database/database.js";

global._utils = testUtils;

expect.extend(matchers);

beforeAll(async () => {
	await database.start();
});

// Note: beforeAll actually runs once before EVERY FILE, not just once for the entire Jest run
// These before/afterEach run for EVERY test so don't make it *too* expensive to run. Just write  sanity/smoke checks
beforeEach(async () => {
	expect(require("./config.js").TESTING).toBeTrue();
	await database.start();
});

afterEach(async () => {
	// Ensuring that the main database was not modified
	// If it was modified... oh no... at least you now know it happened
	expect(require("./config.js").TESTING).toBeTrue();
});

afterAll(async () => {
	// TODO: Validate all the inserts to the test tables
	// Note: This validation can be moved to afterAll or even global teardown if it increases run time too much

	// Take down the database connections for the test
	await database.end();
});
