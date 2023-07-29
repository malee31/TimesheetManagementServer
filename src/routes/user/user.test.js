const request = require("supertest");
const { insertTestUser, generateTestUserObj, insertApiKey, insertTestSession, generateTimes, associateSession } = require("../../utils/testUtils.js");

let mockedDBI;
let app;

beforeAll(async () => {
	jest.mock("../../database/database-interface.js");
	mockedDBI = require("../../database/database-interface.js");
	await mockedDBI.setupTestingDatabase();

	const appExports = require("../../app.js");
	appExports.activateApiRouter();
	app = appExports.default;
});

describe("GET /", () => {
	// TODO: Reconsider test. This ends up indirectly testing the middleware instead
	it("Fetches Nonexistent User", async () => {
		const res = await request(app)
			.get("/user/")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer U-Invalid-Key");

		expect(res.headers["content-type"]).toMatch(/json/);
		expect(res.statusCode).toBe(404);
		expect(res.body).toMatchObject({
			ok: false,
			error: "user_not_found"
		});
	});

	it("Fetches Existing User Without Sessions", async () => {
		const testUser = await insertTestUser(generateTestUserObj("User Fetch Test (No Sessions)"));
		const testApiKeyRow = await insertApiKey(testUser.password, "U-User-Fetch-No-Sessions");

		const res = await request(app)
			.get("/user/")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", `Bearer ${testApiKeyRow.api_key}`);

		expect(res.headers["content-type"]).toMatch(/json/);
		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchObject({
			ok: true,
			id: testUser.id,
			first_name: testUser.first_name,
			last_name: testUser.last_name,
			session: null
		});
	});

	it("Fetches Existing User With Sessions", async () => {
		const testUser = await insertTestUser(generateTestUserObj("User Fetch Test (No Sessions)"));
		const testApiKeyRow = await insertApiKey(testUser.password, "U-User-Fetch-With-Sessions");
		const testSession = (await insertTestSession(generateTimes(testUser.password)))[0];
		await associateSession(testUser.password, testSession.session_id);

		const res = await request(app)
			.get("/user/")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", `Bearer ${testApiKeyRow.api_key}`);

		expect(res.headers["content-type"]).toMatch(/json/);
		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchObject({
			ok: true,
			id: testUser.id,
			first_name: testUser.first_name,
			last_name: testUser.last_name,
			session: testSession.session_id
		});
	});
});

describe("POST /", () => {
	it("Fails To Create User When Missing Data", async () => {
		const res = await request(app)
			.post("/user/")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer A-Admin-Key")
			.send({
				data: "garbage"
			});

		expect(res.statusCode).toBe(403);
		expect(res.body).toMatchObject({
			ok: false,
			error: "user_data_not_nonempty_strings"
		});
	});

	it("Creates New User", async () => {
		const res = await request(app)
			.post("/user/")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer A-Admin-Key")
			.send({
				firstName: "new-user",
				lastName: "last-name",
				password: "new-password"
			});

		expect(res.statusCode).toBe(201);
		expect(res.body).toMatchObject({
			id: expect.any(Number),
			first_name: "new-user",
			last_name: "last-name",
			password: "new-password",
			session: null
		});
	});

	it("Fails To Create User With Existing Password", async () => {
		const testUser = await insertTestUser(generateTestUserObj("User Pre-existing Conflict Test"));

		const res = await request(app)
			.post("/user/")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer A-Admin-Key")
			.send({
				firstName: "test-a-imposter",
				lastName: "last-a",
				password: testUser.password
			});

		expect(res.statusCode).toBe(409);
		expect(res.body).toMatchObject({
			ok: false,
			error: "password_in_use"
		});
	});
});

describe("DELETE /", () => {
	it("Handles No Password Provided", async () => {
		const res = await request(app)
			.delete("/user/")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer A-Admin-Key");

		expect(res.statusCode).toBe(400);
		expect(res.body).toMatchObject({
			ok: false,
			error: "no_password_provided"
		});
	});

	it("Successfully Deletes User", async () => {
		const testUser = await insertTestUser(generateTestUserObj("User To Be Deleted"));

		const res = await request(app)
			.delete("/user/")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer A-Admin-Key")
			.send({
				password: testUser.password
			});

		expect(res.statusCode).toBe(200);
		// TODO: Consider removing message
		expect(res.body).toMatchObject({
			ok: true,
			message: "Successfully Deleted User"
		});
		expect(mockedDBI.getUser(testUser.password)).resolves.toBeNull();
	});

	// TODO: Decide whether deletion should be permanent
	// TODO: Decide whether not found should be already deleted or simply 404 as a result of above
	it("Already Deleted/Nonexistent User", async () => {
		const res = await request(app)
			.delete("/user/")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer A-Admin-Key")
			.send({
				password: "pw-invalid"
			});

		expect(res.statusCode).toBe(202);
		expect(res.body).toMatchObject({
			ok: true,
			warning: "already_deleted"
		});
	});
});

describe("PATCH /password", () => {
	// TODO: Integration test the new password
	// TODO: Integration test the old API keys
	it("Successfully Changes Password", async () => {
		const testUser = await insertTestUser(generateTestUserObj("Change Password User"));
		const testApiKeyRows = await Promise.all([
			insertApiKey(testUser.password, "U-User-Password-Change-1"),
			insertApiKey(testUser.password, "U-User-Password-Change-2", true),
			insertApiKey(testUser.password, "U-User-Password-Change-3")
		]);

		const newPassword = generateTestUserObj().password;

		const res = await request(app)
			.patch("/user/password")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", `Bearer ${testApiKeyRows[0].api_key}`)
			.send({
				new_password: newPassword
			});

		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchObject({
			ok: true,
			message: "Password Successfully Changed"
		});

		expect(mockedDBI.getUser(testUser.password)).resolves.toBeNull();
		expect(mockedDBI.getUser(newPassword)).resolves.not.toBeNull();
		const apiKeyCheckAll = await Promise.all(testApiKeyRows.map(oldApiKeyRow => {
			return mockedDBI.apiKeyLookup(oldApiKeyRow.api_key);
		}));
		expect(apiKeyCheckAll.every(checkApiKeyRows => checkApiKeyRows[0].password === newPassword)).toBeTrue();
	});

	it("Handles Password Conflicts", async () => {
		const testUserAChange = await insertTestUser(generateTestUserObj("User Password Change To Conflict"));
		const testUserBConflict = await insertTestUser(generateTestUserObj("User Password Change To Conflicted"));
		const testApiKeyRowUserA = await insertApiKey(testUserAChange.password, "U-User-Non-Conflicting-Password");

		const res = await request(app)
			.patch("/user/password")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", `Bearer ${testApiKeyRowUserA.api_key}`)
			.send({
				new_password: testUserBConflict.password
			});

		expect(res.statusCode).toBe(409);
		expect(res.body).toMatchObject({
			ok: false,
			error: "password_in_use"
		});
	});
});

describe("GET /status", () => {
	// TODO: Split up test into null vs non-null
	it("Successfully Obtains User Status", async () => {
		const testUser = await insertTestUser(generateTestUserObj("User Status Get"));
		const testApiKeyRow = await insertApiKey(testUser.password, "U-User-Status-Get");

		const res = await request(app)
			.get("/user/status")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", `Bearer ${testApiKeyRow.api_key}`);

		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchObject({
			ok: true,
			user: {
				id: expect.any(Number),
				first_name: testUser.first_name,
				last_name: testUser.last_name,
				session: null
			}
		});
	});
});

describe("GET /sessions", () => {
	it("Successfully Obtains User Sessions", async () => {
		const res = await request(app)
			.get("/user/sessions")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer U-User-A-Key");

		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchObject({
			ok: true,
			sessions: expect.toBeArray()
		});

		res.body.sessions.forEach(session => {
			expect(session).toMatchObject({
				session_id: expect.any(Number),
				startTime: expect.any(Number),
				endTime: expect.any(Number)
			});
		});
	});

	it("Handles No User Sessions Exist", async () => {
		const res = await request(app)
			.get("/user/sessions")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer U-User-D-Key");

		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchObject({
			ok: true,
			sessions: null
		});
	});
});

describe("POST /sessions", () => {
	// Consider behavior with nonexistent passwords
	it("Handles Missing Password", async () => {
		const res = await request(app)
			.post("/user/sessions")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer A-Admin-Key")
			.send({
				password: "",
				startTime: 0,
				endTime: 100,
			});

		expect(res.statusCode).toBe(400);
		expect(res.body).toMatchObject({
			ok: false,
			error: "no_password_provided"
		});
	});

	// TODO: Consider behavior for invalid passwords
	// TODO: Consider conflicts/identical/overlapping entries

	it("Handles Missing/Invalid Start Time", async () => {
		const res = await request(app)
			.post("/user/sessions")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer A-Admin-Key")
			.send({
				password: "pw-a",
				startTime: -1,
				endTime: 100,
			});

		expect(res.statusCode).toBe(400);
		expect(res.body).toMatchObject({
			ok: false,
			error: "invalid_start_time"
		});
	});

	it("Handles Invalid End Time", async () => {
		const res = await request(app)
			.post("/user/sessions")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer A-Admin-Key")
			.send({
				password: "pw-a",
				startTime: 100,
				endTime: 99,
			});

		expect(res.statusCode).toBe(400);
		expect(res.body).toMatchObject({
			ok: false,
			error: "invalid_end_time"
		});
	});

	it("Handles Missing End Times", async () => {
		const res = await request(app)
			.post("/user/sessions")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer A-Admin-Key")
			.send({
				password: "pw-a",
				startTime: 100,
				endTime: null
			});

		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchObject({
			ok: true,
			session: {
				session_id: expect.any(Number),
				startTime: 100,
				endTime: null
			}
		});
	});

	// TODO: Consider handling ongoing sessions being overwritten, overlaps, or strange history
	it("Successfully Adds Arbitrary Sessions", async () => {
		const res = await request(app)
			.post("/user/sessions")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer A-Admin-Key")
			.send({
				password: "pw-a",
				startTime: 100,
				endTime: 200
			});

		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchObject({
			ok: true,
			session: {
				session_id: expect.any(Number),
				startTime: 100,
				endTime: 200
			}
		});
	});
});