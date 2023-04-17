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

export async function apiKeyExchange(password) {
	const validApiKeyRows = await database.queryPromisify("SELECT * FROM api_keys_v2 WHERE password = ? AND revoked = FALSE", [password]);
	if(validApiKeyRows.length === 0) {
		console.warn("An API key was generated during an exchange. This ideally shouldn't occur unless the database was directly modified");
		const newApiKey = makeNewApiKey();
		await database.queryPromisify("INSERT INTO api_keys_v2 VALUES(NULL, ?, ?, FALSE)", [password, newApiKey]);
		return newApiKey;
	}

	return validApiKeyRows[0]["api_key"];
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

export async function getAllUsers() {
	const users = await database.queryPromisify("SELECT id, first_name, last_name, session FROM users_v2");
	if(users.length === 0) {
		console.warn("No users in the database");
	}
	return users;
}

export async function getAllUsersWithStatus() {
	const users = await database.queryPromisify("SELECT u.id, u.first_name, u.last_name, s.session_id, s.startTime, s.endTime FROM users_v2 u LEFT JOIN sessions_v2 s ON u.session = s.session_id");
	if(users.length === 0) {
		console.warn("No users in the database");
	}
	return users;
}

export async function getUser(password) {
	const users = await database.queryPromisify("SELECT id, first_name, last_name, session FROM users_v2 WHERE password = ?", [password]);
	if(!users.length) return null;
	return users[0];
}

export async function createUser(userObj) {
	// TODO: Wrap in a transaction for rollbacks
	const userArgs = [userObj["firstName"], userObj["lastName"], userObj["password"]]
		.map(arg => typeof arg === "string" ? arg.trim() : arg);
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


export async function changePassword(oldPassword, newPassword) {
	// TODO: Wrap in a transaction
	// TODO: Ensure no password collisions
	console.log(`Update ${oldPassword} to ${newPassword}`)
	await database.queryPromisify("UPDATE users_v2 SET password = ? WHERE password = ?", [newPassword, oldPassword]);
	await database.queryPromisify("UPDATE api_keys_v2 SET password = ? WHERE password = ?", [newPassword, oldPassword]);
}

export async function deleteUser(password) {
	// TODO: Wrap in a transaction
	const deleteUser = await database.queryPromisify("DELETE FROM users_v2 WHERE password = ?", [password]);
	if(deleteUser.affectedRows === 0) {
		const noUserError = new TypeError("No user with this password");
		noUserError.code = "already_deleted";
		throw noUserError;
	}

	await database.queryPromisify("DELETE FROM api_keys_v2 WHERE password = ?", [password]);
}

export async function listSessions(password) {
	const userSessions = await database.queryPromisify("SELECT session_id, startTime, endTime FROM sessions_v2 WHERE password = ?", [password]);
	if(userSessions.length === 0) {
		console.warn("No sessions for user");
		return null;
	}
	return userSessions;
}

export async function getLatestSession(password) {
	// Assumption made that user.session is kept up-to-date
	const latestSessionRes = await database.queryPromisify("SELECT s.session_id, s.startTime, s.endTime FROM sessions_v2 s RIGHT JOIN users_v2 u ON u.session = s.session_id WHERE u.password = ?", [password]);
	if(latestSessionRes.length === 0 || latestSessionRes[0].session_id === null) {
		console.warn("No latest session for user");
		return null;
	}
	return latestSessionRes[0];
}

export async function createSession(password, startTime, endTime = null) {
	await database.queryPromisify("INSERT INTO sessions_v2 VALUES(NULL, ?, ?, ?)", [password, startTime, endTime]);
	const newSession = (await database.queryPromisify("SELECT session_id, startTime, endTime FROM sessions_v2 WHERE password = ? ORDER BY startTime DESC LIMIT 1", [password]))[0];
	await database.queryPromisify("UPDATE users_v2 SET session = ? WHERE password = ?", [newSession.session_id, password])
	return newSession;
}

export async function patchSession(patchedSession) {
	// Uses session_id to patch startTime and endTime.
	// Password and session existence are not checked so ensure they are secure
	await database.queryPromisify("UPDATE sessions_v2 SET startTime = ?, endTime = ? WHERE session_id = ?", [
		patchedSession["startTime"],
		patchedSession["endTime"],
		patchedSession["session_id"]
	]);
}

export async function deleteSession(sessionId) {
	const deleteRes = await database.queryPromisify("DELETE FROM sessions_v2 WHERE session_id = ?", [sessionId]);
	// TODO: Handle edge case where the current session is deleted
	if(deleteRes.affectedRows === 0) {
		const noDeleteErr = new RangeError("Session Not Found");
		noDeleteErr.code = "not_found";
		throw noDeleteErr;
	}
}