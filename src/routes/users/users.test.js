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
	it("Fetches All Users", async () => {
		const res = await request(app)
			.get("/users")
			.expect(200);

		expect(res.body).toMatchObject({
			ok: true,
			users: expect.arrayContaining([
				expect.objectContaining({
					id: expect.any(Number),
					first_name: expect.any(String),
					last_name: expect.any(String),
					session: expect.any(Number),
				})
			])
		});
	});
});

describe("GET /status", () => {
	it("Fetches All Users And Statuses", async () => {
		const res = await request(app)
			.get("/users/status")
			.expect(200);

		expect(res.body).toMatchObject({
			ok: true,
			users: expect.arrayContaining([
				expect.objectContaining({
					id: expect.any(Number),
					first_name: expect.any(String),
					last_name: expect.any(String),
					session: expect.objectContaining({
						session_id: expect.any(Number),
						startTime: expect.any(Number),
						endTime: expect.toBeOneOf([null, expect.any(Number)])
					})
				})
			])
		});
	});
});

describe("GET /sessions", () => {
	it("Missing Count", async () => {
		const res = await request(app)
			.get("/users/sessions?page=1")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer A-Admin-Key")
			.expect(400);

		expect(res.body).toMatchObject({
			ok: false,
			error: "no_count_provided"
		});
	});

	it("Missing Page", async () => {
		const res = await request(app)
			.get("/users/sessions?count=50")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer A-Admin-Key")
			.expect(400);

		expect(res.body).toMatchObject({
			ok: false,
			error: "no_page_provided"
		});
	});

	it("Invalid Count", async () => {
		const res = await request(app)
			.get("/users/sessions?page=1&count=0")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer A-Admin-Key")
			.expect(400);

		expect(res.body).toMatchObject({
			ok: false,
			error: "invalid_count"
		});
	});

	it("Invalid Page", async () => {
		const res = await request(app)
			.get("/users/sessions?page=0&count=50")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer A-Admin-Key")
			.expect(400);

		expect(res.body).toMatchObject({
			ok: false,
			error: "invalid_page_number"
		});
	});

	it("Fetches All Sessions With Pagination", async () => {
		const res = await request(app)
			.get("/users/sessions?page=1&count=3")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer A-Admin-Key")
			.expect(200);

		expect(res.body).toMatchObject({
			ok: true,
			sessions: expect.toBeArrayOfSize(3)
		});
	});

	it("Fetches No Results", async () => {
		const res = await request(app)
			.get("/users/sessions?page=9999&count=1")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer A-Admin-Key")
			.expect(200);

		expect(res.body).toMatchObject({
			ok: true,
			warning: "no_results",
			sessions: expect.toBeArrayOfSize(0)
		});
	});
});