const request = require("supertest");
const { generateTestUserObj, insertTestUser, insertApiKey } = require("../../../utils/testUtils.js");

let app;
beforeEach(async () => {
	jest.mock("../../../database/database-interface.js");
	const mockedDBI = require("../../../database/database-interface.js");
	// TODO: Check beforeAll
	await mockedDBI.setupTestingDatabase();

	const appExports = require("../../../app.js");
	appExports.activateApiRouter();
	app = appExports.default;
});

describe("POST /exchange", () => {
	// TODO: Check if checking if user exists is required (It should already be handled by middleware iirc)
	it("Exchanges API Keys", async () => {
		const exchangeTestUser = await insertTestUser(generateTestUserObj("Exchange API Key"));
		// TODO: Question whether this should really be done. Maybe add another util to generate the select statements to run directly
		const exchangeApiKeyRow = await insertApiKey(exchangeTestUser.password, "U-Exchange-API-Key");

		const res = await request(app)
			.post("/user/auth/exchange")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.send({ password: exchangeTestUser.password });

		expect(res.headers["content-type"]).toMatch(/json/);
		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchObject({
			ok: true,
			api_key: exchangeApiKeyRow.api_key
		});
	});
});

describe("POST /revoke", () => {
	it("Revokes API Keys", async () => {
		const testUser = await insertTestUser(generateTestUserObj("Revoke API Key"));
		const oldValidApiKeyRow = await insertApiKey(testUser.password, "U-Revoked-This-Api-Key-1");

		const res = await request(app)
			.post("/user/auth/revoke")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", `Bearer ${oldValidApiKeyRow.api_key}`)
			.send();

		expect(res.headers["content-type"]).toMatch(/json/);
		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchObject({
			ok: true,
			api_key: expect.stringMatching(/^U-.*$/)
		});
		expect(res.body.api_key).not.toBe(oldValidApiKeyRow.api_key);
	});

	it("Detects Revoked API Keys", async () => {
		const testUser = await insertTestUser(generateTestUserObj("Already Revoked API Key"));
		const revokedApiKeyRow = await insertApiKey(testUser.password, "U-Revoked-Api-Key-1", true);

		const res = await request(app)
			.post("/user/auth/revoke")
			.set("Accept", "application/json")
			.set("Content-Type", "application/json; charset=utf-8")
			.set("Authorization", `Bearer ${revokedApiKeyRow.api_key}`)
			.send();

		expect(res.headers["content-type"]).toMatch(/json/);
		expect(res.statusCode).toBe(409);
		expect(res.body).toMatchObject({
			ok: false,
			error: "already_revoked"
		});
	});
});