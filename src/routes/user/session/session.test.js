const request = require("supertest");
const mockedDBI = require("../../../database/database-interface.js");

describe("DELETE /:sessionid", () => {
	beforeEach(() => {
		jest.mock("../../../database/database-interface.js");
		const mockedDBI = require("../../../database/database-interface.js");
		mockedDBI.setSampleData();
	});

	it("Handles Invalid Session Id", () => {
		// return true;
	});

	it("Handles No Session With Given Session Id", () => {
		// return true;
	});

	it("Deletes Session With Given Session Id", () => {
		// return true;
	});
});

describe("GET /latest", () => {
	beforeEach(() => {
		jest.mock("../../../database/database-interface.js");
		const mockedDBI = require("../../../database/database-interface.js");
		mockedDBI.setSampleData();
	});

	it("Handles No Previous Sessions", () => {
		// return true;
	});

	it("Handles Getting Latest Session", () => {
		// return true;
	});
});

describe("PATCH /latest", () => {
	beforeEach(() => {
		jest.mock("../../../database/database-interface.js");
		const mockedDBI = require("../../../database/database-interface.js");
		mockedDBI.setSampleData();
	});

	it("Handles Login Without Previous Sessions", () => {
		// return true;
	});

	it("Handles Missing Method", () => {
		// return true;
	});

	it("Handles Standard Login", () => {
		// return true;
	});

	it("Handles Standard Logout", () => {
		// return true;
	});
});