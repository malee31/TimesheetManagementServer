const request = require("supertest");

let mockedDBI;
let app;

beforeEach(() => {
	jest.mock("../../database/database-interface.js");
	mockedDBI = require("../../database/database-interface.js");
	mockedDBI.setSampleData();

	const appExports = require("../../app.js");
	appExports.activateApiRouter();
	app = appExports.default;
});

describe("GET /", () => {
	it("Fetches All Users", () => {
		// return true;
	});
});

describe("GET /status", () => {
	it("Fetches All Users And Statuses", () => {
		// return true;
	});
});

describe("GET /sessions", () => {
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