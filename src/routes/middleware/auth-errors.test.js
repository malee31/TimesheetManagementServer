let authMiddleware;

beforeEach(async () => {
	jest.mock("../../database/database-interface.js");
	const mockedDBI = require("../../database/database-interface.js");
	// TODO: Check beforeAll
	await mockedDBI.setupTestingDatabase();
	authMiddleware = require("./auth-errors.js").default;
});

describe("Auth Middleware", () => {
	it("Handles No Auth", () => {
		const { noAuth: authExistsMiddleware } = authMiddleware;

		const req = {};
		req.header = jest.fn(headerName => {
			if(headerName.toLowerCase() === "authorization") {
				return ""
			}

			return undefined;
		});

		const res = {};
		res.send = jest.fn();
		res.status = jest.fn(() => res);

		const next = jest.fn();

		authExistsMiddleware(req, res, next);
		expect(res.status).toBeCalledWith(401);
		expect(res.send).toBeCalledWith(
			expect.objectContaining({
				ok: false,
				error: "not_authed"
			})
		);
		expect(next).not.toHaveBeenCalled();
	});

	it("Handles Valid User Auth", async () => {
		const { noAuth: authExistsMiddleware } = authMiddleware;

		const database = require("../../database/database-interface.js");
		const authUser = await database.createUser(global._utils.generateTestUserObj("Valid User Auth"));
		// TODO: Question whether this should really be done. Maybe add another util to generate the select statements to run directly
		const authUserApiKey = await database.apiKeyExchange(authUser.password);

		const req = {};
		req.header = jest.fn(headerName => {
			if(headerName.toLowerCase() === "authorization") {
				return `Bearer ${authUserApiKey}`
			}

			return undefined;
		});

		const res = {};
		res.send = jest.fn();
		res.status = jest.fn(() => res);

		const next = jest.fn();

		authExistsMiddleware(req, res, next);
		expect(res.status).not.toBeCalled();
		expect(res.send).not.toBeCalled();
		expect(next).toHaveBeenCalled();
		expect(req.locals).toMatchObject({
			apiKey: authUserApiKey
		});
	});
});

describe("User Auth Middleware", () => {
	it("Handles Invalid User Auth Format", () => {
		// Note: Depends on order and position in array. Update test if changed
		const { user: userMiddleware } = authMiddleware;
		const userAuthMiddleware = userMiddleware[1];

		const req = {};
		req.locals = {
			apiKey: "X-Invalid-Key-Prefix"
		};

		const res = {};
		res.send = jest.fn();
		res.status = jest.fn(() => res);

		const next = jest.fn();

		userAuthMiddleware(req, res, next);
		expect(res.status).toBeCalledWith(401);
		expect(res.send).toBeCalledWith(
			expect.objectContaining({
				ok: false,
				error: "invalid_auth_format"
			})
		);
		expect(next).not.toHaveBeenCalled();
	});

	it("Handles Valid User Auth", async () => {
		// Note: Depends on order and position in array. Update test if changed
		const { user: userMiddleware } = authMiddleware;
		const userAuthMiddleware = userMiddleware[1];

		const database = require("../../database/database-interface.js");
		const authUser = await database.createUser(global._utils.generateTestUserObj("Valid User Auth"));
		// TODO: Question whether this should really be done. Maybe add another util to generate the select statements to run directly
		const authUserApiKey = await database.apiKeyExchange(authUser.password);

		const req = {};
		req.locals = {
			apiKey: authUserApiKey
		};

		const res = {};
		res.send = jest.fn();
		res.status = jest.fn(() => res);

		const next = jest.fn();

		await userAuthMiddleware(req, res, next);
		expect(res.status).not.toBeCalled();
		expect(res.send).not.toBeCalled();
		expect(req.locals).toMatchObject({
			apiKey: authUserApiKey,
			password: authUser.password
		});
	});

	it("Handles Revoked User Keys", async () => {
		// Note: Depends on order and position in array. Update test if changed
		const { user: userMiddleware } = authMiddleware;
		const userAuthMiddleware = userMiddleware[1];

		const authUser = global._utils.generateTestUserObj("Valid User Auth");
		const password = authUser.password;
		await global._utils.insertTestUser(authUser);
		// TODO: Question whether this should really be done. Maybe add another util to generate the select statements to run directly
		const apiKeyRevoked = "U-User-Auth-Revoked";
		const apiKeyValid = "U-User-Auth-Valid";
		await global._utils.insertApiKey(password, apiKeyRevoked, true);

		// Line technically not required for this test
		await global._utils.insertApiKey(password, apiKeyValid);

		const req = {};
		req.locals = {
			apiKey: apiKeyRevoked
		};

		const res = {};
		res.send = jest.fn();
		res.status = jest.fn(() => res);

		const next = jest.fn();

		await userAuthMiddleware(req, res, next);
		expect(res.status).toBeCalledWith(401);
		expect(res.send).toBeCalledWith(
			expect.objectContaining({
				ok: false,
				error: "auth_revoked_by_user"
			})
		);
		expect(req.locals.apiKey).toBe(apiKeyRevoked);
	});

	it("Handles Invalid User Keys", async () => {
		// Note: Depends on order and position in array. Update test if changed
		const { user: userMiddleware } = authMiddleware;
		const userAuthMiddleware = userMiddleware[1];

		const req = {};
		req.locals = {
			apiKey: "U-Invalid-Key"
		};

		const res = {};
		res.send = jest.fn();
		res.status = jest.fn(() => res);

		const next = jest.fn();

		await userAuthMiddleware(req, res, next);
		expect(res.status).toBeCalledWith(404);
		expect(res.send).toBeCalledWith(
			expect.objectContaining({
				ok: false,
				error: "user_not_found"
			})
		);
		expect(req.locals.apiKey).toBe("U-Invalid-Key");
	});
});

describe("Admin Auth Middleware", () => {
	it("Handles Invalid Admin Auth Format", () => {
		// Note: Depends on order and position in array. Update test if changed
		const { admin: adminMiddleware } = authMiddleware;
		const adminAuthMiddleware = adminMiddleware[1];

		const req = {};
		req.locals = {
			apiKey: "X-Invalid-Key-Prefix"
		};

		const res = {};
		res.send = jest.fn();
		res.status = jest.fn(() => res);

		const next = jest.fn();

		adminAuthMiddleware(req, res, next);
		expect(res.status).toBeCalledWith(401);
		expect(res.send).toBeCalledWith(
			expect.objectContaining({
				ok: false,
				error: "invalid_auth_format"
			})
		);
		expect(next).not.toHaveBeenCalled();
	});

	it("Handles Valid Admin Auth", async () => {
		// Note: Depends on order and position in array. Update test if changed
		const { admin: adminMiddleware } = authMiddleware;
		const adminAuthMiddleware = adminMiddleware[1];

		const req = {};
		req.locals = {
			apiKey: "A-Admin-Key"
		};

		const res = {};
		res.send = jest.fn();
		res.status = jest.fn(() => res);

		const next = jest.fn();

		await adminAuthMiddleware(req, res, next);
		expect(res.status).not.toBeCalled();
		expect(res.send).not.toBeCalled();
		expect(req.locals.apiKey).toBe("A-Admin-Key");
	});

	it("Handles Invalid Admin Keys", async () => {
		// Note: Depends on order and position in array. Update test if changed
		const { admin: adminMiddleware } = authMiddleware;
		const adminAuthMiddleware = adminMiddleware[1];

		const req = {};
		req.locals = {
			apiKey: "A-Invalid-Key"
		};

		const res = {};
		res.send = jest.fn();
		res.status = jest.fn(() => res);

		const next = jest.fn();

		await adminAuthMiddleware(req, res, next);
		expect(res.status).toBeCalledWith(401);
		expect(res.send).toBeCalledWith(
			expect.objectContaining({
				ok: false,
				error: "invalid_admin_auth"
			})
		);
		expect(req.locals.apiKey).toBe("A-Invalid-Key");
	});
});