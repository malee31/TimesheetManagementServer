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

	// TODO: Revoked keys
	// TODO: Invalid api keys
});