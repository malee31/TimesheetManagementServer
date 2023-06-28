const request = require("supertest");

let mockedDBI;
let app;

beforeEach(async () => {
	jest.mock("../database/database-interface.js");
	mockedDBI = require("../database/database-interface.js");
	mockedDBI.setSampleData();

	// await mockedDBI.setupTestingDatabase();

	const appExports = require("../app.js");
	appExports.activateApiRouter();
	app = appExports.default;
});

it("Log In + Sign In", async () => {
	// TODO: Skip creating a user and use a pre-made user
	const e2ePassword = "e2e-test-password";
	const createRes = await request(app)
		.post("/user")
		.set("Accept", "application/json")
		.set("Content-Type", "application/json; charset=utf-8")
		.set("Authorization", "Bearer A-Admin-Key")
		.send({
			firstName: "e2e-test-user",
			lastName: "e2e-last-name",
			password: e2ePassword
		});

	expect(createRes.statusCode).toBe(201);
	expect(createRes.body.password).toBe(e2ePassword);

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