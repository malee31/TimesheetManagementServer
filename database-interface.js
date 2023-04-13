import database from "./database.js";
import {v4 as uuidv4} from "uuid";

// This file acts as an abstraction layer between the database and the code for easy compatibility with any database
// TODO: This file should contain methods to interact and manipulate database information
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
	const newApiKey = `U-${uuidv4()}`;
	await database.queryPromisify("INSERT INTO api_keys_v2 VALUES(NULL, ?, ?, FALSE)", [oldApiKeyRow["password"], newApiKey]);

	return newApiKey;
}