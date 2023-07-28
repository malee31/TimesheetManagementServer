import database from "./database.js";
import { makeNewApiKey } from "../utils/apiKey.js";
import { TESTING } from "../../config";

// This file acts as an abstraction layer between the database and the code for easy compatibility with any database
// This file should contain methods to interact and manipulate database information
export async function apiKeyLookup(apiKey) {
	return await database.singleQueryPromisify("SELECT * FROM api_keys_v2 WHERE api_key = ?", [apiKey]);
}

export async function apiKeyExchange(password) {
	const validApiKeyRows = await database.singleQueryPromisify("SELECT * FROM api_keys_v2 WHERE password = ? AND revoked = FALSE", [password]);
	if(validApiKeyRows.length === 0) {
		console.warn("An API key was generated during an exchange. This ideally shouldn't occur unless the database was directly modified");
		const newApiKey = makeNewApiKey();
		await database.singleQueryPromisify("INSERT INTO api_keys_v2 VALUES(NULL, ?, ?, FALSE)", [password, newApiKey]);
		return newApiKey;
	}

	return validApiKeyRows[0]["api_key"];
}

export async function apiKeyRegenerate(oldApiKey) {
	const oldApiKeyQuery = await database.singleQueryPromisify("SELECT * FROM api_keys_v2 WHERE api_key = ?", [oldApiKey]);
	const oldApiKeyRow = oldApiKeyQuery[0];
	if(oldApiKeyRow["revoked"]) {
		const revokedError = new RangeError("Already Revoked");
		revokedError.code = "already_revoked";
		throw revokedError;
	}

	const transaction = await database.transactionPromisify();
	await database.transactionQuery(transaction, "UPDATE api_keys_v2 SET revoked = TRUE WHERE api_key = ?", [oldApiKey]);
	const newApiKey = makeNewApiKey();
	await database.transactionQuery(transaction, "INSERT INTO api_keys_v2 VALUES(NULL, ?, ?, FALSE)", [oldApiKeyRow["password"], newApiKey]);
	await transaction.commit();

	return newApiKey;
}

export async function getAllUsers() {
	const users = await database.singleQueryPromisify("SELECT id, first_name, last_name, session FROM users_v2");
	if(!TESTING && users.length === 0) {
		console.warn("No users in the database");
	}
	return users;
}

export async function getAllUsersWithStatus() {
	const users = await database.singleQueryPromisify("SELECT u.id, u.first_name, u.last_name, s.session_id, s.startTime, s.endTime FROM users_v2 u LEFT JOIN sessions_v2 s ON u.session = s.session_id");
	if(users.length === 0) {
		console.warn("No users in the database");
	}

	// Modify SQL output (self) to fit output schema
	for(const userStatus of users) {
		if(userStatus.session_id !== null) {
			userStatus.session = {
				session_id: userStatus.session_id,
				startTime: userStatus.startTime,
				endTime: userStatus.endTime
			};
		}

		delete userStatus.session_id;
		delete userStatus.startTime;
		delete userStatus.endTime;
	}
	return users;
}

export async function getUser(password) {
	const users = await database.singleQueryPromisify("SELECT id, first_name, last_name, session FROM users_v2 WHERE password = ?", [password]);
	if(!users.length) return null;
	return users[0];
}

/**
 * Creates a new user (No latest session will be added or set)
 * IMPORTANT: Must ALWAYS work without fail or error since test cases assume that this works when setting up a test database
 * @param {Object} userObj - Includes a first name, last name, and password as strings. They are all mandatory
 * @return {Object} Returns the new user object
 */
export async function createUser(userObj) {
	const userArgs = [userObj["firstName"], userObj["lastName"], userObj["password"]]
		.map(arg => typeof arg === "string" ? arg.trim() : arg);

	if(!userArgs.every(arg => typeof arg === "string" && arg.trim().length > 0)) {
		const newUserError = new TypeError("User object must contain only nonempty strings for first name, last name, and password");
		newUserError.code = "user_data_not_nonempty_strings";
		throw newUserError;
	}

	const transaction = await database.transactionPromisify();
	await database.transactionQuery(transaction, "INSERT INTO users_v2 VALUES(NULL, ?, ?, ?, NULL)", userArgs);
	const newApiKey = makeNewApiKey();
	await database.transactionQuery(transaction, "INSERT INTO api_keys_v2 VALUES(NULL, ?, ?, FALSE)", [userArgs[2], newApiKey]);

	// Guaranteed to exist
	const newUser = (await database.transactionQuery(transaction, "SELECT * FROM users_v2 WHERE password = ?", [userArgs[2]]))[0];
	await transaction.commit();

	return newUser;
}

export async function changePassword(oldPassword, newPassword) {
	// Note: Leaks semi-sensitive information into logs
	if(!TESTING) {
		console.log(`Update ${oldPassword} to ${newPassword}`);
	}

	const apiKeyRows = await database.singleQueryPromisify("SELECT * FROM api_keys_v2 WHERE password = ?", [newPassword]);
	if(apiKeyRows.length !== 0) {
		// Note: Leaks semi-sensitive information into logs
		if(!TESTING) {
			console.log(`Reject password change resulting in a collision for ${newPassword}`);
		}

		return {
			ok: false,
			error: "password_in_use"
		}
	}

	const transaction = await database.transactionPromisify();
	await database.transactionQuery(transaction, "UPDATE users_v2 SET password = ? WHERE password = ?", [newPassword, oldPassword]);
	await database.transactionQuery(transaction, "UPDATE api_keys_v2 SET password = ? WHERE password = ?", [newPassword, oldPassword]);
	await transaction.commit();

	return {
		ok: true
	};
}

export async function deleteUser(password) {
	const transaction = await database.transactionPromisify();
	const deleteUser = await database.transactionQuery(transaction, "DELETE FROM users_v2 WHERE password = ?", [password]);
	if(deleteUser.affectedRows === 0) {
		const noUserError = new TypeError("No user with this password");
		noUserError.code = "already_deleted";
		throw noUserError;
	}

	await database.transactionQuery(transaction, "DELETE FROM api_keys_v2 WHERE password = ?", [password]);
	await transaction.commit();
}

export async function listSessions(password) {
	const userSessions = await database.singleQueryPromisify("SELECT session_id, startTime, endTime FROM sessions_v2 WHERE password = ?", [password]);
	if(userSessions.length === 0) {
		if(!TESTING) console.warn("No sessions for user");
		return null;
	}
	return userSessions;
}

export async function getLatestSession(password) {
	// Assumption made that user.session is kept up-to-date
	const latestSessionRes = await database.singleQueryPromisify("SELECT s.session_id, s.startTime, s.endTime FROM sessions_v2 s RIGHT JOIN users_v2 u ON u.session = s.session_id WHERE u.password = ?", [password]);
	if(latestSessionRes.length === 0 || latestSessionRes[0].session_id === null) {
		// console.warn("No latest session for user");
		return null;
	}
	return latestSessionRes[0];
}

/**
 * Creates a new session for a user
 * IMPORTANT: Must ALWAYS work without fail or error since test cases assume that this works when setting up a test database
 * @async
 * @param {string} password - User's password used to look the user row up
 * @param {number} startTime - Time in seconds epoch that the person started the session
 * @param {number|null} [endTime = null] - Time in seconds epoch that the person ended the session
 * @param {boolean} [skipUpdate = false] - If not explicitly set to true, the new session will be set as the user's latest session
 * @return {Object} Returns the new session object
 */
export async function createSession(password, startTime, endTime = null, skipUpdate=false) {
	await database.singleQueryPromisify("INSERT INTO sessions_v2 VALUES(NULL, ?, ?, ?)", [password, startTime, endTime]);
	let newSession;
	if(endTime === null) {
		newSession = (await database.singleQueryPromisify("SELECT session_id, startTime, endTime FROM sessions_v2 WHERE password = ? AND startTime = ? AND endTime IS NULL ORDER BY session_id DESC LIMIT 1", [password, startTime]))[0];
	} else {
		newSession = (await database.singleQueryPromisify("SELECT session_id, startTime, endTime FROM sessions_v2 WHERE password = ? AND startTime = ? AND endTime = ? ORDER BY session_id DESC LIMIT 1", [password, startTime, endTime]))[0];
	}
	if(!skipUpdate) {
		await database.singleQueryPromisify("UPDATE users_v2 SET session = ? WHERE password = ?", [newSession.session_id, password])
	}
	return newSession;
}

export async function patchSession(patchedSession) {
	// Uses session_id to patch startTime and endTime.
	// Password and session existence are not checked so ensure they are secure
	await database.singleQueryPromisify("UPDATE sessions_v2 SET startTime = ?, endTime = ? WHERE session_id = ?", [
		patchedSession["startTime"],
		patchedSession["endTime"],
		patchedSession["session_id"]
	]);
}

export async function deleteSession(sessionId) {
	const deleteRes = await database.singleQueryPromisify("DELETE FROM sessions_v2 WHERE session_id = ?", [sessionId]);
	// TODO: Handle edge case where the current session is deleted
	if(deleteRes.affectedRows === 0) {
		const noDeleteErr = new RangeError("Session Not Found");
		noDeleteErr.code = "not_found";
		throw noDeleteErr;
	}
}

export async function getSessions(count, offset) {
	const sessionsRes = await database.singleQueryPromisify("SELECT session_id, startTime, endTime FROM sessions_v2 ORDER BY session_id LIMIT ? OFFSET ?", [count, offset]);
	if(sessionsRes.length === 0) {
		return null;
	}

	return sessionsRes;
}