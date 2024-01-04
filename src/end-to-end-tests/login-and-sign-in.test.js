const request = require("supertest");

const e2ePassword = "e2e-login-test-password";
let mockedDBI;
let app;

beforeEach(async () => {
	jest.mock("../database/database-interface.js");
	mockedDBI = require("../database/database-interface.js");
	// TODO: Check beforeAll
	await mockedDBI.setupTestingDatabase();

	const appExports = require("../app.js");
	appExports.activateApiRouter();
	app = appExports.default;

	await mockedDBI.createUser({
		firstName: "e2e-login-test-user",
		lastName: "e2e-last-name",
		password: e2ePassword
	});
});

it("Log In + Sign In", async () => {
	const loginRes = await request(app)
		.post("/user/auth/exchange")
		.set("Accept", "application/json")
		.set("Content-Type", "application/json; charset=utf-8")
		.send({
			password: e2ePassword
		});

	expect(loginRes.statusCode).toBe(200);
	expect(loginRes.body).toContainKey("api_key");

	const apiKey = loginRes.body.api_key;

	const signInRes = await request(app)
		.patch("/user/session/latest")
		.set("Accept", "application/json")
		.set("Content-Type", "application/json; charset=utf-8")
		.set("Authorization", `Bearer ${apiKey}`)
		.send({
			method: "sign_in"
		});

	expect(signInRes.status).toBe(200);
	expect(signInRes.body.ok).toBeTrue();
	expect(signInRes.body).toContainKey("session")
	expect(signInRes.body.session).toContainKeys(["startTime", "endTime"])
	expect(signInRes.body.session.startTime).toBeGreaterThan(0);
	expect(signInRes.body.session.endTime).toBeNull();
});