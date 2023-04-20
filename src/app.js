import express from "express";
import initialRouter from "./routes/initial-router.js";
import apiRouter from "./routes/api-router.js";

const app = express();
app.use(express.json());
// Is swapped to apiRouter once the startup process is completed
let router = initialRouter;

// Allows for swapping out the router in use during runtime
app.use((req, res, next) => {
	return router(req, res, next);
});

export function activateApiRouter() {
	router = apiRouter;
}

export default app;