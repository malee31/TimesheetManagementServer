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
	})
});