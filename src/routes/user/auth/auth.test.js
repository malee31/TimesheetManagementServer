const request = require("supertest");

describe("POST /exchange", () => {
	beforeEach(() => {
		jest.mock("../../../database/database-interface.js");
		const mockedDBI = require("../../../database/database-interface.js");
		mockedDBI.setSampleData();
	});

	it("Exchanges API Keys", async () => {
		const appExports = require("../../../app.js");
		appExports.activateApiRouter();
		const app = appExports.default;

		const res = await request(app)
			.post("/user/auth/exchange")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.send({ password: "pw-a" });

		expect(res.headers["content-type"]).toMatch(/json/);
		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchObject({
			ok: true,
			api_key: "U-User-A-Key"
		});
	});
});

describe("POST /revoke", () => {
	beforeEach(() => {
		jest.mock("../../../database/database-interface.js");
		const mockedDBI = require("../../../database/database-interface.js");
		mockedDBI.setSampleData();
	});

	it("Revokes API Keys", async () => {
		const appExports = require("../../../app.js");
		appExports.activateApiRouter();
		const app = appExports.default;

		const res = await request(app)
			.post("/user/auth/revoke")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer U-User-C-Key")
			.send();

		expect(res.headers["content-type"]).toMatch(/json/);
		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchObject({
			ok: true,
			api_key: expect.stringMatching(/^U-.*$/)
		});
	});

	it("Detects Revoked API Keys", async () => {
		const appExports = require("../../../app.js");
		appExports.activateApiRouter();
		const app = appExports.default;

		const res = await request(app)
			.post("/user/auth/revoke")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", "Bearer U-User-C-Old-Key")
			.send();

		expect(res.headers["content-type"]).toMatch(/json/);
		expect(res.statusCode).toBe(409);
		expect(res.body).toMatchObject({
			ok: false,
			error: "already_revoked"
		});
	});
});