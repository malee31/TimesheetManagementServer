const request = require("supertest");
const mockedDBI = require("../../database/database-interface.js");

describe("GET /", () => {
	beforeEach(() => {
		jest.mock("../../database/database-interface.js");
		const mockedDBI = require("../../database/database-interface.js");
		mockedDBI.setSampleData();
	});

	it("Fetches Existing User", () => {
		// return true;
	});

	it("Fetches Nonexistent User", () => {
		// return true;
	});
});

describe("POST /", () => {
	beforeEach(() => {
		jest.mock("../../database/database-interface.js");
		const mockedDBI = require("../../database/database-interface.js");
		mockedDBI.setSampleData();
	});

	it("Fails To Create User Without Data", () => {
		// return true;
	});

	it("Creates New User", () => {
		// return true;
	});

	it("Fails To Create Existing User", () => {
		// return true;
	});
});

describe("DELETE /", () => {
	beforeEach(() => {
		jest.mock("../../database/database-interface.js");
		const mockedDBI = require("../../database/database-interface.js");
		mockedDBI.setSampleData();
	});

	it("Successfully Deletes User", () => {
		// return true;
	});

	// TODO: Decide whether deletion should be permanent
	it("Already Deleted User", () => {
		// return true;
	});
});

describe("PATCH /password", () => {
	beforeEach(() => {
		jest.mock("../../database/database-interface.js");
		const mockedDBI = require("../../database/database-interface.js");
		mockedDBI.setSampleData();
	});

	it("Successfully Changes Password", () => {
		// return true;
	});
});

describe("GET /status", () => {
	beforeEach(() => {
		jest.mock("../../database/database-interface.js");
		const mockedDBI = require("../../database/database-interface.js");
		mockedDBI.setSampleData();
	});

	it("Successfully Obtains User Status", () => {
		// return true;
	});
});

describe("GET /sessions", () => {
	beforeEach(() => {
		jest.mock("../../database/database-interface.js");
		const mockedDBI = require("../../database/database-interface.js");
		mockedDBI.setSampleData();
	});

	it("Successfully Obtains User Sessions", () => {
		// return true;
	});
});

describe("POST /sessions", () => {
	beforeEach(() => {
		jest.mock("../../database/database-interface.js");
		const mockedDBI = require("../../database/database-interface.js");
		mockedDBI.setSampleData();
	});

	// Consider behavior with nonexistent passwords
	it("Handles Missing Password", () => {
		// return true;
	});

	it("Handles Missing/Invalid Start Time", () => {
		// return true;
	});

	it("Handles Invalid End Time", () => {
		// return true;
	});

	it("Handles Missing End Times", () => {
		// return true;
	});

	// TODO: Consider handling ongoing sessions being overwritten, overlaps, or strange history
	it("Successfully Adds Arbitrary Sessions", () => {
		// return true;
	});
});