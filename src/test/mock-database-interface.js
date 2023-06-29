/**
 * @file An entirely JSON and in-memory storage and state storage interface mirroring the database functionality
 * This was a BAD idea since it resulted in the database version used in production becoming a completely untested mirror
 * This will soon be retired in favor of a REAL testing database pre-populated with test data but temporarily kept as a relic
 */

import { makeNewApiKey } from "../utils/apiKey.js";

const tables = {
	users: [],
	sessions: [],
	apiKeys: []
};

const ids = {
	users: 1,
	sessions: 1,
	apiKeys: 1,
};

function autoId(tableName) {
	if(!ids[tableName]) throw RangeError("Invalid table: " + tableName);
	return (ids[tableName]++);
}

function selectObj(obj, keys) {
	if(!obj) return null;

	const res = {};
	for(const key of keys) {
		res[key] = obj[key];
	}

	return res;
}

// Mocks begin
export async function apiKeyLookup(apiKey) {
	return tables.apiKeys.filter(r => r.api_key === apiKey);
}

export async function apiKeyExchange(password) {
	const validApiKeyRows = tables.apiKeys.filter(r => r.revoked === false && r.password === password);
	if(validApiKeyRows.length === 0) {
		console.warn("An API key was generated during an exchange. This ideally shouldn't occur unless the database was directly modified");
		const newApiKey = makeNewApiKey();
		tables.apiKeys.push({
			id: autoId("apiKeys"),
			password: password,
			api_key: newApiKey,
			revoked: false
		});
		return newApiKey;
	}

	return validApiKeyRows[0]["api_key"];
}

export async function apiKeyRegenerate(oldApiKey) {
	const oldApiKeyQuery = tables.apiKeys.filter(r => r.api_key === oldApiKey);
	const oldApiKeyRow = oldApiKeyQuery[0];
	if(oldApiKeyRow["revoked"]) {
		const revokedError = new RangeError("Already Revoked");
		revokedError.code = "already_revoked";
		throw revokedError;
	}

	tables.apiKeys.find(r => r.api_key === oldApiKey).revoked = true;
	const newApiKey = makeNewApiKey();
	tables.apiKeys.push({
		id: autoId("apiKeys"),
		password: oldApiKeyRow["password"],
		api_key: newApiKey,
		revoked: false
	});

	return newApiKey;
}

export async function getAllUsers() {
	return tables.users.map(u => selectObj(u, ["id", "first_name", "last_name", "session"]));
}

export async function getAllUsersWithStatus() {
	const users = tables.users.map(u => {
		const user = selectObj(u, ["id", "first_name", "last_name"]);
		user.session = selectObj(tables.sessions.find(s => u.session === s.session_id) || null, [
			"session_id", "startTime", "endTime"
		]);

		return user;
	});

	if(users.length === 0) {
		console.warn("No users in the database");
	}
	return users;
}

export async function getUser(password) {
	const users = tables.users.filter(u => u.password === password).map(u => selectObj(u, ["id", "first_name", "last_name", "session"]));
	if(!users.length) return null;
	return users[0];
}

export async function createUser(userObj) {
	const userArgs = [userObj["firstName"], userObj["lastName"], userObj["password"]]
		.map(arg => typeof arg === "string" ? arg.trim() : arg);

	if(!userArgs.every(arg => typeof arg === "string" && arg.trim().length > 0)) {
		const newUserError = new TypeError("User object must contain only nonempty strings for first name, last name, and password");
		newUserError.code = "user_data_not_nonempty_strings";
		throw newUserError;
	}

	if(tables.users.some(user => user.password === userObj.password)) {
		const duplicateError = new Error();
		duplicateError.code = "ER_DUP_ENTRY";
		throw duplicateError;
	}

	tables.users.push({
		id: autoId("users"),
		first_name: userArgs[0],
		last_name: userArgs[1],
		password: userArgs[2],
		session: null
	});
	const newApiKey = makeNewApiKey();
	tables.apiKeys.push({
		id: autoId("apiKeys"),
		password: userArgs[2],
		api_key: newApiKey,
		revoked: false
	});

	// Guaranteed to exist
	return tables.users.filter(u => u.password === userArgs[2])[0];
}

export async function changePassword(oldPassword, newPassword) {
	const apiKeyRows = tables.apiKeys.filter(k => k.password === newPassword);
	if(apiKeyRows.length !== 0) {
		return {
			ok: false,
			error: "password_in_use"
		}
	}

	tables.users
		.filter(u => u.password === oldPassword)
		.forEach(u => {
			u.password = newPassword;
		});

	tables.apiKeys
		.filter(k => k.password === oldPassword)
		.forEach(k => {
			k.password = newPassword;
		});

	return {
		ok: true
	};
}

export async function deleteUser(password) {
	const oldLen = tables.users.length;
	tables.users = tables.users.filter(u => u.password !== password);
	if(oldLen === tables.users.length) {
		const noUserError = new TypeError("No user with this password");
		noUserError.code = "already_deleted";
		throw noUserError;
	}

	tables.apiKeys = tables.apiKeys.filter(k => k.password !== password);
}

export async function listSessions(password) {
	const userSessions = tables.sessions
		.filter(s => s.password === password)
		.map(s => selectObj(s, ["session_id", "startTime", "endTime"]));

	if(userSessions.length === 0) {
		return null;
	}
	return userSessions;
}

export async function getLatestSession(password) {
	// Assumption made that user.session is kept up-to-date
	const user = tables.users.filter(u => u.password === password);
	const latestSessionRes = tables.sessions.filter(s => user.some(u => s.session_id === u.session)).map(s => selectObj(s, ["session_id", "startTime", "endTime"]));
	if(latestSessionRes.length === 0 || latestSessionRes[0].session_id === null) {
		// console.warn("No latest session for user");
		return null;
	}
	return latestSessionRes[0];
}

export async function createSession(password, startTime, endTime = null, skipUpdate) {
	tables.sessions.push({
		session_id: autoId("sessions"),
		password: password,
		startTime: startTime,
		endTime: endTime
	});
	const newSession = tables.sessions
		.filter(s => s.password === password && s.startTime === startTime && s.endTime === endTime)
		.sort((s1, s2) => s2.session_id - s1.session_id)
		.slice(0, 1)[0];

	if(!skipUpdate) {
		tables.users.filter(u => u.password === password).forEach(u => u.session === newSession.session_id);
	}
	return newSession;
}

export async function patchSession(patchedSession) {
	// Uses session_id to patch startTime and endTime.
	// Password and session existence are not checked so ensure they are secure
	tables.sessions
		.filter(s => s.session_id === patchedSession["session_id"])
		.forEach(s => {
			s.startTime = patchedSession["startTime"];
			s.endTime = patchedSession["endTime"];
		});
}

export async function deleteSession(sessionId) {
	const oldLen = tables.sessions.length;
	tables.sessions = tables.sessions.filter(s => s.session_id !== sessionId);
	// TODO: Handle edge case where the current session is deleted
	if(oldLen === tables.sessions.length) {
		const noDeleteErr = new RangeError("Session Not Found");
		noDeleteErr.code = "not_found";
		throw noDeleteErr;
	}
}

export async function getSessions(count, offset) {
	const sessionsRes = tables.sessions
		.sort((s1, s2) => s1.session_id - s2.session_id)
		.slice(offset, offset + count)
		.map(s => selectObj(s, ["session_id", "startTime", "endTime"]));

	if(sessionsRes.length === 0) {
		return null;
	}

	return sessionsRes;
}

export const isMocked = true;
// For direct modification
export const mock_data = {
	tables: tables,
	ids: ids
};

// Note: Test all inserts and other functions before using. Assumes all function work
// Take care when modifying the sample data to make sure that unique ids remain unique and relations are properly made
export function setSampleData() {
	const data = mock_data;
	const tables = data.tables;
	const ids = data.ids;

	const makeUser = (id, first, last, password, session = null) => ({
		id: id,
		first_name: first,
		last_name: last,
		password: password,
		session: session
	});

	const makeSession = (id, password, start, end = null) => ({
		session_id: id,
		password: password,
		startTime: start,
		endTime: end
	});

	const makeKey = (id, password, key, revoke = false) => ({
		id: id,
		password: password,
		api_key: key,
		revoked: revoke
	});

	tables.users = [
		makeUser(1, "test-a", "last-a", "pw-a", 1),
		makeUser(2, "test-b", "last-b", "pw-b", 2),
		makeUser(3, "test-c", "last-c", "pw-c", 4),
		makeUser(4, "test-d", "last-d", "pw-d")
	];

	tables.sessions = [
		// On the dot for 30 minutes
		makeSession(1, "pw-a", 1681887600000, 1681887600000 + 30 * 60 * 1000),
		// 1 minute after for 30 minutes
		makeSession(2, "pw-b", 1681887660000, 1681887660000 + 30 * 60 * 1000),
		// 1 hour after for 1 hour
		makeSession(3, "pw-c", 1681891200000, 1681891200000 + 60 * 60 * 1000),
		// 2 hours after indefinitely
		makeSession(4, "pw-c", 1681894800000)
	];

	tables.apiKeys = [
		makeKey(1, "pw-a", "U-User-A-Key"),
		makeKey(2, "pw-b", "U-User-B-Key"),
		makeKey(3, "pw-c", "U-User-C-Old-Key", true),
		makeKey(4, "pw-c", "U-User-C-Key"),
		makeKey(5, "pw-d", "U-User-D-Key")
	];

	// Fix auto-indices
	ids.users = Math.max(ids.users, tables.users.reduce((acc, val) => Math.max(acc, val.id), 1));
	ids.sessions = Math.max(ids.sessions, tables.sessions.reduce((acc, val) => Math.max(acc, val.session_id), 1));
	ids.apiKeys = Math.max(ids.apiKeys, tables.apiKeys.reduce((acc, val) => Math.max(acc, val.id), 1));
}