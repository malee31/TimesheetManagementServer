const request = require("supertest");

let mockedDBI;
let app;

beforeEach(() => {
	jest.mock("../../../database/database-interface.js");
	mockedDBI = require("../../../database/database-interface.js");
	mockedDBI.setSampleData();

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

	it("Deletes Session With Given Session Id", async () => {
		const res = await request(app)
			.delete("/user/session/1")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer A-Admin-Key")
			.send();

		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchObject({
			ok: true,
			old_session_id: 1
		});
	});
});

describe("GET /latest", () => {
	it("Handles No Previous Sessions", async () => {
		const res = await request(app)
			.get("/user/session/latest")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer U-User-D-Key");

		expect(res.statusCode).toBe(404);
		expect(res.body).toMatchObject({
			ok: false,
			error: "no_session_found"
		});
	});

	it("Handles Getting Latest Session", async () => {
		const res = await request(app)
			.get("/user/session/latest")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer U-User-A-Key");

		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchObject({
			ok: true,
			session: {
				session_id: 1,
				startTime: 1681887600000,
				endTime: 1681887600000 + 30 * 60 * 1000
			}
		});
	});
});

describe("PATCH /latest", () => {
	it("Handles Login Without Previous Sessions", async () => {
		const res = await request(app)
			.patch("/user/session/latest")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer U-User-D-Key")
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
		const res = await request(app)
			.patch("/user/session/latest")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer U-User-C-Key")
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
		const res = await request(app)
			.patch("/user/session/latest")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer U-User-A-Key")
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
		const res = await request(app)
			.patch("/user/session/latest")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer U-User-C-Key")
			.send({
				method: "sign_out"
			});

		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchObject({
			ok: true,
			session: {
				session_id: 4,
				startTime: 1681894800000,
				endTime: expect.any(Number)
			}
		});
	});

	// TODO: Split up signing out test
	// TODO: Consider sending session
	// TODO: Consider null sessions
	it("Handles Already Logged In/Out", async () => {
		const res = await request(app)
			.patch("/user/session/latest")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer U-User-C-Key")
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