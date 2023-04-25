describe("Auth Middleware", () => {
	beforeEach(() => {
		jest.mock("../../database/database-interface.js");
		const mockedDBI = require("../../database/database-interface.js");
		mockedDBI.setSampleData();
	});

	it("Handles No Auth", () => {
		const { noAuth: authExistsMiddleware } = require("./auth-errors.js").default;

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

	it("Handles Valid User Auth", () => {
		const { noAuth: authExistsMiddleware } = require("./auth-errors.js").default;

		const req = {};
		req.header = jest.fn(headerName => {
			if(headerName.toLowerCase() === "authorization") {
				return "Bearer U-User-A-Key"
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
			apiKey: "U-User-A-Key"
		})
	});
});

describe("User Auth Middleware", () => {
	beforeEach(() => {
		jest.mock("../../database/database-interface.js");
		const mockedDBI = require("../../database/database-interface.js");
		mockedDBI.setSampleData();
	});

	it("Handles Invalid User Auth Format", () => {
		// Note: Depends on order and position in array. Update test if changed
		const { user: userMiddleware } = require("./auth-errors.js").default;
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
		const { user: userMiddleware } = require("./auth-errors.js").default;
		const userAuthMiddleware = userMiddleware[1];

		const req = {};
		req.locals = {
			apiKey: "U-User-A-Key"
		};

		const res = {};
		res.send = jest.fn();
		res.status = jest.fn(() => res);

		const next = jest.fn();

		await userAuthMiddleware(req, res, next);
		expect(res.status).not.toBeCalled();
		expect(res.send).not.toBeCalled();
		expect(req.locals).toMatchObject({
			apiKey: "U-User-A-Key",
			password: "pw-a"
		});
	});

	it("Handles Revoked User Keys", async () => {
		// Note: Depends on order and position in array. Update test if changed
		const { user: userMiddleware } = require("./auth-errors.js").default;
		const userAuthMiddleware = userMiddleware[1];

		const req = {};
		req.locals = {
			apiKey: "U-User-C-Old-Key"
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
		expect(req.locals.apiKey).toBe("U-User-C-Old-Key");
	});

	it("Handles Invalid User Keys", async () => {
		// Note: Depends on order and position in array. Update test if changed
		const { user: userMiddleware } = require("./auth-errors.js").default;
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