const request = require("supertest");
const { insertTestUser, generateTestUserObj, generateTimes, insertTestSession, associateSession } = require("../../utils/testUtils.js");

let mockedDBI;
let app;

beforeAll(async () => {
	jest.mock("../../database/database-interface.js");
	mockedDBI = require("../../database/database-interface.js");
	await mockedDBI.setupTestingDatabase();

	const appExports = require("../../app.js");
	appExports.activateApiRouter();
	app = appExports.default;

	// These tests require a minimum number of users in the database
	// Decreasing these constants may fail some tests
	const MIN_NUM_USERS = 10;
	const MIN_NUM_SESSIONS = 10;

	const generatedUsers = [];
	for(let userNum = 0; userNum < MIN_NUM_USERS; userNum++) {
		const newTestUser = await insertTestUser(generateTestUserObj("Users Endpoint Minimum User", `Number ${userNum}`));
		generatedUsers.push(newTestUser);
	}

	// Attaches first half of the sessions to the first user and the second half to the second. The others have no sessions
	// Order irrelevant
	const numSessionsFirstHalf = Math.floor(MIN_NUM_SESSIONS / 2);
	const firstHalfSessions = await insertTestSession(generateTimes(generatedUsers[0].password, numSessionsFirstHalf));
	const secondHalfSessions = await insertTestSession(generateTimes(generatedUsers[1].password, MIN_NUM_SESSIONS - numSessionsFirstHalf));
	// Associate sessions
	await Promise.all([
		associateSession(generatedUsers[0].password, firstHalfSessions[firstHalfSessions.length - 1].session_id),
		associateSession(generatedUsers[1].password, secondHalfSessions[secondHalfSessions.length - 1].session_id)
	]);
}, 10000);

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
					session: expect.toBeOneOf([null, expect.any(Number)])
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
					session: expect.toBeOneOf([
						expect.objectContaining({
							session_id: expect.any(Number),
							startTime: expect.any(Number),
							endTime: expect.toBeOneOf([null, expect.any(Number)])
						}),
						null
					])
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

	// TODO: Check page 2 etc to ensure no overlap
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
