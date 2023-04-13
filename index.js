import * as dotenv from "dotenv";
// Configure server environment variables
dotenv.config();
import express from "express";
import database from "./database.js";
import apiRouter from "./routes/api-router.js";
import initialRouter from "./initial-router.js";
import { apiKeyRegenerate } from "./database-interface.js";

const app = express();
// Is swapped to apiRouter once the startup process is completed
let router = initialRouter;

// Allows for swapping out the router in use during runtime
app.use((req, res, next) => {
	return router(req, res, next);
});

app.listen(process.env.API_PORT ?? 3000, () => {
	console.log("Server Active");
});

// Start up the database and swap out the router
console.log("Starting Database");
database.start()
	.then(() => {
		router = apiRouter;
		console.log("API Router Connected!");
	})
	.catch(err => {
		console.warn("Unable to start API:");
		console.error(err);
		process.exit(1);
	});