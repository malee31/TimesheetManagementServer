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

describe("Require Specific Body Keys Middleware", () => {
	it("Pass All Keys Exist", () => {
		const { ensureBodyKeys } = require("./body-errors.js");
		const ensureKeyMiddleware = ensureBodyKeys(["a", "b", "c"])[1];

		const req = {};
		req.body = {
			a: "something",
			b: "something",
			c: "something",
		};

		const res = {};
		res.send = jest.fn();
		res.status = jest.fn(() => res);

		const next = jest.fn();

		ensureKeyMiddleware(req, res, next);
		expect(res.status).not.toBeCalled();
		expect(res.send).not.toBeCalled();
		expect(next).toBeCalled();
	});

	it("Rejects If Missing Keys", () => {
		const { ensureBodyKeys } = require("./body-errors.js");
		const ensureKeyMiddleware = ensureBodyKeys(["a", "b", "c"])[1];

		const req = {};
		req.body = {
			a: "something",
			c: "something",
		};

		const res = {};
		res.send = jest.fn();
		res.status = jest.fn(() => res);

		const next = jest.fn();

		ensureKeyMiddleware(req, res, next);
		expect(res.status).toBeCalledWith(400);
		expect(res.send).toBeCalledWith(
			expect.objectContaining({
				ok: false,
				error: "body_missing_fields",
				missing_fields: ["b"]
			})
		);
		expect(next).not.toHaveBeenCalled();
	});

	it("Handles Custom Errors", () => {
		const { ensureBodyKeys } = require("./body-errors.js");
		const ensureKeyMiddleware = ensureBodyKeys(["a", "b", "c"], {
			b: {
				error: {
					ok: false,
					error: "b_missing"
				}
			}
		})[1];

		const req = {};
		req.body = {
			a: "something",
			c: "something",
		};

		const res = {};
		res.send = jest.fn();
		res.status = jest.fn(() => res);

		const next = jest.fn();

		ensureKeyMiddleware(req, res, next);
		expect(res.status).toBeCalledWith(400);
		expect(res.send).toBeCalledWith(
			expect.objectContaining({
				ok: false,
				error: "b_missing"
			})
		);
		expect(next).not.toHaveBeenCalled();
	});
});

