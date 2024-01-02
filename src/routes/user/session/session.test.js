const request = require("supertest");
const { insertTestUser, generateTestUserObj, insertApiKey, insertTestSession, generateTimes, associateSession } = require("../../../utils/testUtils.js");

let mockedDBI;
let app;

beforeAll(async () => {
	jest.mock("../../../database/database-interface.js");
	mockedDBI = require("../../../database/database-interface.js");
	await mockedDBI.setupTestingDatabase();

	const appExports = require("../../../app.js");
	appExports.activateApiRouter();
	app = appExports.default;
});

describe("DELETE /:sessionid", () => {
	it("Handles Malformed Session Id", async () => {
		const res = await request(app)
			.delete("/user/session/xxx")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer A-Admin-Key")
			.send();

		expect(res.statusCode).toBe(400);
		expect(res.body).toMatchObject({
			ok: false,
			error: "malformed_session_id"
		});
	});

	it("Handles Invalid Session Id", async () => {
		const res = await request(app)
			.delete("/user/session/-1")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer A-Admin-Key")
			.send();

		expect(res.statusCode).toBe(400);
		expect(res.body).toMatchObject({
			ok: false,
			error: "invalid_session_id"
		});
	});

	it("Handles No Session With Given Session Id", async () => {
		const res = await request(app)
			.delete("/user/session/99999")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer A-Admin-Key")
			.send();

		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchObject({
			ok: true,
			warning: "nothing_to_delete"
		});
	});

	// TODO: Add or protect against deleting ongoing or current session
	it("Deletes Session With Given Session Id", async () => {
		const testUser = await insertTestUser(generateTestUserObj("Session Standard Initial Login"));
		await insertApiKey(testUser.password, "U-session-delete-session-by-id");
		const testSession = (await insertTestSession(generateTimes(testUser.password, 1, false)))[0];

		const res = await request(app)
			.delete(`/user/session/${testSession.session_id}`)
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer A-Admin-Key")
			.send();

		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchObject({
			ok: true,
			old_session_id: testSession.session_id
		});
	});
});

describe("GET /latest", () => {
	it("Handles No Previous Sessions", async () => {
		const testUser = await insertTestUser(generateTestUserObj("Session Standard Initial Login"));
		const testApiKeyRow = await insertApiKey(testUser.password, "U-session-no-previous-session");

		const res = await request(app)
			.get("/user/session/latest")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", `Bearer ${testApiKeyRow.api_key}`);

		expect(res.statusCode).toBe(404);
		expect(res.body).toMatchObject({
			ok: false,
			error: "no_session_found"
		});
	});

	it("Handles Getting Latest Session", async () => {
		const testUser = await insertTestUser(generateTestUserObj("Session Standard Initial Login"));
		const testApiKeyRow = await insertApiKey(testUser.password, "U-session-get-latest-session");
		const testSessions = await insertTestSession(generateTimes(testUser.password, 10));
		const latestTestSession = testSessions[testSessions.length - 1];
		await associateSession(testUser.password, latestTestSession.session_id);

		const res = await request(app)
			.get("/user/session/latest")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", `Bearer ${testApiKeyRow.api_key}`);

		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchObject({
			ok: true,
			session: {
				session_id: latestTestSession.session_id,
				startTime: latestTestSession.startTime,
				endTime: latestTestSession.endTime
			}
		});
	});
});

describe("PATCH /latest", () => {
	it("Handles Login Without Previous Sessions", async () => {
		const testUser = await insertTestUser(generateTestUserObj("Session Standard Initial Login"));
		const testApiKeyRow = await insertApiKey(testUser.password, "U-session-first-login");

		const res = await request(app)
			.patch("/user/session/latest")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", `Bearer ${testApiKeyRow.api_key}`)
			.send({
				method: "sign_in"
			});

		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchObject({
			ok: true,
			session: {
				session_id: expect.any(Number),
				startTime: expect.any(Number),
				endTime: null
			}
		});
	});

	it("Handles Invalid Method", async () => {
		const testUser = await insertTestUser(generateTestUserObj("Session Standard Initial Login"));
		const testApiKeyRow = await insertApiKey(testUser.password, "U-session-invalid-method");

		const res = await request(app)
			.patch("/user/session/latest")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", `Bearer ${testApiKeyRow.api_key}`)
			.send({
				method: "sign_in_and_out"
			});

		expect(res.statusCode).toBe(400);
		expect(res.body).toMatchObject({
			ok: false,
			error: "invalid_session_method"
		});
	});

	it("Handles Standard Login", async () => {
		const testUser = await insertTestUser(generateTestUserObj("Session Standard Login"));
		const testApiKeyRow = await insertApiKey(testUser.password, "U-session-standard-login");
		await insertTestSession(generateTimes(testUser.password));

		const res = await request(app)
			.patch("/user/session/latest")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", `Bearer ${testApiKeyRow.api_key}`)
			.send({
				method: "sign_in"
			});

		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchObject({
			ok: true,
			session: {
				session_id: expect.any(Number),
				startTime: expect.any(Number),
				endTime: null
			}
		});
	});

	it("Handles Standard Logout", async () => {
		const testUser = await insertTestUser(generateTestUserObj("Session Standard Login"));
		const testApiKeyRow = await insertApiKey(testUser.password, "U-session-standard-logout");
		const testSession = (await insertTestSession(generateTimes(testUser.password, 1, true)))[0];
		await associateSession(testUser.password, testSession.session_id);

		const res = await request(app)
			.patch("/user/session/latest")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", `Bearer ${testApiKeyRow.api_key}`)
			.send({
				method: "sign_out"
			});

		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchObject({
			ok: true,
			session: {
				session_id: testSession.session_id,
				startTime: testSession.startTime,
				endTime: expect.any(Number)
			}
		});
	});

	// TODO: Split up signing out test
	// TODO: Consider sending session
	// TODO: Consider null sessions
	it("Handles Already Logged In/Out", async () => {
		const testUser = await insertTestUser(generateTestUserObj("Session Standard Login"));
		const testApiKeyRow = await insertApiKey(testUser.password, "U-session-already-logged-out");
		const testSession = (await insertTestSession(generateTimes(testUser.password, 1, true)))[0];
		await associateSession(testUser.password, testSession.session_id);

		const res = await request(app)
			.patch("/user/session/latest")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", `Bearer ${testApiKeyRow.api_key}`)
			.send({
				method: "sign_in"
			});

		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchObject({
			ok: true,
			warning: "already_signed_in"
		});
	});
});