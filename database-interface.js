import database from "./database.js";
import { v4 as uuidv4 } from "uuid";

function makeNewApiKey() {
	return `U-${uuidv4()}`;
}

// This file acts as an abstraction layer between the database and the code for easy compatibility with any database
// This file should contain methods to interact and manipulate database information
export async function apiKeyLookup(apiKey) {
	return await database.queryPromisify("SELECT * FROM api_keys_v2 WHERE api_key = ?", [apiKey]);
}

export async function apiKeyRegenerate(oldApiKey) {
	// TODO: Use transactions for SQL for rollback support
	const oldApiKeyQuery = await database.queryPromisify("SELECT * FROM api_keys_v2 WHERE api_key = ?", [oldApiKey]);
	const oldApiKeyRow = oldApiKeyQuery[0];
	if(oldApiKeyRow["revoked"]) {
		const revokedError = new RangeError("Already Revoked");
		revokedError.code = "already_revoked";
		throw revokedError;
	}

	await database.queryPromisify("UPDATE api_keys_v2 SET revoked = TRUE WHERE api_key = ?", [oldApiKey]);
	const newApiKey = makeNewApiKey();
	await database.queryPromisify("INSERT INTO api_keys_v2 VALUES(NULL, ?, ?, FALSE)", [oldApiKeyRow["password"], newApiKey]);

	return newApiKey;
}

export async function getUser(password) {
	const users = await database.queryPromisify("SELECT id, first_name, last_name, session FROM users_v2 WHERE password = ?", [password]);
	if(!users.length) return null;
	return users[0];
}

export async function createUser(userObj) {
	// TODO: Wrap in a transaction for rollbacks
	const userArgs = [userObj["firstName"], userObj["lastName"], userObj["password"]]
		.map(arg => arg.trim());
	if(!userArgs.every(arg => typeof arg === "string" && arg.trim().length > 0)) {
		const newUserError = new TypeError("User object must contain only nonempty strings for first name, last name, and password");
		newUserError.code = "user_data_not_nonempty_strings";
		throw newUserError;
	}

	await database.queryPromisify("INSERT INTO users_v2 VALUES(NULL, ?, ?, ?, NULL)", userArgs);
	const newApiKey = makeNewApiKey();
	await database.queryPromisify("INSERT INTO api_keys_v2 VALUES(NULL, ?, ?, FALSE)", [userArgs[2], newApiKey]);

	// Guaranteed to exist
	return (await database.queryPromisify("SELECT * FROM users_v2 WHERE password = ?", [userArgs[2]]))[0];
}