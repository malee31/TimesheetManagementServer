import express from "express";
import cors from "cors";
import initialRouter from "./routes/initial-router.js";
import apiRouter from "./routes/api-router.js";

const app = express();
app.use(cors());

app.use((req, res, next) => {
	express.json()(req, res, err => {
		if(err && err.type === "entity.parse.failed") {
			return res.status(400).send({
				ok: false,
				error: "invalid-json-body"
			});
		}

		if(err) {
			console.warn("Unknown JSON/Body Parsing Error:");
			console.error(err);

			return res.status(400).send({
				ok: false,
				error: "unknown-body-parse-error",
				code: err.type
			});
		}

		next();
	});
});
// Is swapped to apiRouter once the startup process is completed
let router = initialRouter;

// Allows for swapping out the router in use during runtime
app.use((req, res, next) => {
	console.log(`[${req.method}] ${req.url} | ${req.ip} | ${req.headers["user-agent"]}`);
	return router(req, res, next);
});

export function activateApiRouter() {
	router = apiRouter;
}

export default app;