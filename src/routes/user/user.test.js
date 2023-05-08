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
	it("Fetches Existing User", async () => {
		const res = await request(app)
			.get("/user/")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer U-User-A-Key");

		expect(res.headers["content-type"]).toMatch(/json/);
		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchObject({
			ok: true,
			id: 1,
			first_name: "test-a",
			last_name: "last-a",
			session: null
		});
	});

	// TODO: Reconsider test. This ends up testing the middleware instead
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
		const res = await request(app)
			.post("/user/")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer A-Admin-Key")
			.send({
				firstName: "test-a-imposter",
				lastName: "last-a",
				password: "pw-a"
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
		const res = await request(app)
			.delete("/user/")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer A-Admin-Key")
			.send({
				password: "pw-a"
			});

		expect(res.statusCode).toBe(200);
		// TODO: Consider removing message
		expect(res.body).toMatchObject({
			ok: true,
			message: "Successfully Deleted User"
		});
		expect(await mockedDBI.getUser("pw-a")).toBeNull();
	});

	// TODO: Decide whether deletion should be permanent
	// TODO: Decide whether not found should be already deleted or simply 404
	it("Already Deleted User", async () => {
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
		const res = await request(app)
			.patch("/user/password")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer U-User-A-Key")
			.send({
				new_password: "pw-A-new"
			});

		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchObject({
			ok: true,
			message: "Password Successfully Changed"
		});
	});

	it("Handles Password Conflicts", async () => {
		const res = await request(app)
			.patch("/user/password")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer U-User-A-Key")
			.send({
				new_password: "pw-d"
			});

		expect(res.statusCode).toBe(409);
		expect(res.body).toMatchObject({
			ok: false,
			error: "password_in_use"
		});
	});
});

describe("GET /status", () => {
	it("Successfully Obtains User Status", async () => {
		const res = await request(app)
			.get("/user/status")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer U-User-A-Key");

		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchObject({
			ok: true,
			user: {
				id: expect.any(Number),
				first_name: "test-a",
				last_name: "last-a",
				session: expect.toBeOneOf([null, expect.toBeObject()])
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