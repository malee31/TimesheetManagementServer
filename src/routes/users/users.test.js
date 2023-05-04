const request = require("supertest");
const mockedDBI = require("../../database/database-interface.js");

describe("GET /", () => {
	beforeEach(() => {
		jest.mock("../../database/database-interface.js");
		const mockedDBI = require("../../database/database-interface.js");
		mockedDBI.setSampleData();
	});

	it("Fetches All Users", () => {
		// return true;
	});
});

describe("GET /status", () => {
	beforeEach(() => {
		jest.mock("../../database/database-interface.js");
		const mockedDBI = require("../../database/database-interface.js");
		mockedDBI.setSampleData();
	});

	it("Fetches All Users And Statuses", () => {
		// return true;
	});
});

describe("GET /sessions", () => {
	beforeEach(() => {
		jest.mock("../../database/database-interface.js");
		const mockedDBI = require("../../database/database-interface.js");
		mockedDBI.setSampleData();
	});

	it("Missing Count", () => {
		// return true;
	});

	it("Missing Page", () => {
		// return true;
	});

	it("Invalid Count", () => {
		// return true;
	});

	it("Invalid Page", () => {
		// return true;
	});

	it("Fetches All Sessions With Pagination", () => {
		// return true;
	});

	it("Fetches No Results", () => {
		// return true;
	});
});