import * as dotenv from "dotenv";
// Configure server environment variables
dotenv.config();
import app, { activateApiRouter } from "./src/app.js";
import database from "./src/database/database.js";

app.listen(process.env.API_PORT ?? 3000, () => {
	console.log("Server Active");
});

// Start up the database and swap out the router once it is ready
console.log("Starting Database");
database.start()
	.then(() => {
		activateApiRouter();
		console.log("API Router Connected!");
	})
	.catch(err => {
		console.warn("Unable to start API:");
		console.error(err);
		process.exit(1);
	});