import { noBodyErrors } from "./body-errors.js";

describe("No Empty Body Middleware", () => {
	it("Handles Empty Body Error", () => {
		const { noBodyErrors } = require("./body-errors.js");

		const req = {};
		req.body = {};
		req.header = jest.fn(headerName => {
			if(headerName.toLowerCase() === "content-length") {
				return 2;
			}

			return undefined;
		});

		const res = {};
		res.send = jest.fn();
		res.status = jest.fn(() => res);

		const next = jest.fn();

		noBodyErrors(req, res, next);
		expect(res.status).toBeCalledWith(400);
		expect(res.send).toBeCalledWith(
			expect.objectContaining({
				ok: false,
				error: "request_body_empty"
			})
		);
		expect(next).not.toHaveBeenCalled();
	});
});