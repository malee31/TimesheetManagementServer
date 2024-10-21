import { API_PORT } from "./config.js";
import app, { activateApiRouter } from "./src/app.js";
import * as database from "./src/database/database.js";

app.listen(API_PORT, () => {
	console.log("===== Web Server Active =====");
});

// Start up the database and swap out the router once it is ready
console.log("===== Starting Database =====");
database.start()
	.then(() => {
		activateApiRouter();
		console.log("===== API Active =====");
		console.log("===== Ready For Requests =====");
	})
	.catch(err => {
		console.warn("!!!!! Unable To Start API (Reason below) !!!!! ");
		console.error(err);
		process.exit(1);
	});
