import database from "./database.js";

// This file acts as an abstraction layer between the database and the code for easy compatibility with any database
// TODO: This file should contain methods to interact and manipulate database information
export async function apiKeyLookup(apiKey) {
	return await database.queryPromisify("SELECT * FROM api_keys_v2 WHERE api_key = ?", [apiKey]);
}