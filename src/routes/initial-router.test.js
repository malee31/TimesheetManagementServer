const request = require("supertest");
const express = require("express");

describe("Initial Router", () => {
	it("Returns 503 During Startup", async () => {
		const initialRouter = require("./initial-router.js").default;
		const initialApp = express();
		initialApp.use(initialRouter);

		await request(initialApp)
			.get("/")
			.expect(503)
			.expect({
				ok: false,
				error: "server_restarting",
				message: "Server restarting... Try again in a bit"
			});
	});
})