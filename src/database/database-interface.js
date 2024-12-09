import { makeNewApiKey } from "../utils/apiKey.js";
import { TESTING } from "../../config.js";
import db, { ApiKey, Session, SessionAssociation, User } from "./database.js";
import sequelize, { Op } from "sequelize";
import tableNames from "./table-names.js";

// This file acts as an abstraction layer between the database and the code for easy compatibility with any database
// This file should contain methods to interact and manipulate database information
export async function apiKeyLookup(apiKey) {
	return await ApiKey.findAll({
		where: {
			api_key: apiKey
		},
		raw: true
	});
}

export async function apiKeyExchange(password) {
	const validApiKeyRows = await ApiKey.findAll({
		where: {
			password: password,
			revoked: false
		},
		raw: true
	});

	if(validApiKeyRows.length === 0) {
		console.warn("An API key was generated during an exchange. This ideally shouldn't occur unless the database was directly modified");
		const newApiKey = makeNewApiKey();
		await ApiKey.create({
			password: password,
			api_key: newApiKey
		});
		return newApiKey;
	}

	return validApiKeyRows[0]["api_key"];
}

export async function apiKeyRegenerate(oldApiKey) {
	const oldApiKeyQuery = await ApiKey.findAll({
		where: {
			api_key: oldApiKey
		},
		raw: true
	});
	const oldApiKeyRow = oldApiKeyQuery[0];
	if(oldApiKeyRow.revoked) {
		const revokedError = new RangeError("Already Revoked");
		revokedError.code = "already_revoked";
		throw revokedError;
	}

	const transaction = await db.transaction();
	try {
		await ApiKey.update({
			revoked: true
		}, {
			where: {
				api_key: oldApiKey
			},
			transaction: transaction,
			returning: false
		});
		const newApiKey = makeNewApiKey();
		await ApiKey.create({
			password: oldApiKeyRow.password,
			api_key: newApiKey,
			revoked: false
		}, {
			transaction: transaction
		});
		await transaction.commit();

		return newApiKey;
	} catch(err) {
		console.log("[ROLLBACK] Failed to regenerate an API Key");
		console.error(err);
		await transaction.rollback();
		throw err;
	}
}

export async function getAllUsers() {
	const users = await User.findAll({
		attributes: [
			"id",
			"first_name",
			"last_name",
			"session"
		],
		raw: true
	});
	if(!TESTING && users.length === 0) {
		console.warn("No users in the database");
	}
	return users;
}

export async function getAllUsersWithStatus() {
	const users = await User.findAll({
		attributes: [
			"id",
			"first_name",
			"last_name",
			[
				// Note the wrapping parentheses in the call below!
				sequelize.literal(`(
                    SELECT SUM(endTime)
                    FROM ${tableNames.sessions} AS Sessions
                    WHERE User.password = Sessions.password
                    AND Sessions.endTime IS NOT NULL
                )`),
				"total_end",
			],
			[
				// Note the wrapping parentheses in the call below!
				sequelize.literal(`(
                    SELECT SUM(startTime)
                    FROM ${tableNames.sessions} AS Sessions
                    WHERE User.password = Sessions.password
                    AND Sessions.endTime IS NOT NULL
                )`),
				"total_start",
			]
		],
		include: [{
			model: Session,
			association: SessionAssociation,
			attributes: ["session_id", "startTime", "endTime"],
			where: {
				password: {
					[Op.eq]: "User.password"
				}
			},
			required: false  // This is effectively the Sequelize equivalent of a `LEFT JOIN` in SQL
		}],
		raw: true
	});
	if(users.length === 0) {
		console.warn("No users in the database");
	}

	// Modify SQL output (self) to fit output schema
	for(const userStatus of users) {
		if(userStatus[`session_data.session_id`] !== null) {
			userStatus.session = {
				session_id: userStatus[`session_data.session_id`],
				startTime: userStatus[`session_data.startTime`],
				endTime: userStatus[`session_data.endTime`]
			};
		} else {
			userStatus.session = null;
		}

		userStatus.total_sessions = 0;
		if(userStatus["total_start"] && userStatus["total_end"]) {
			userStatus.total_sessions = userStatus["total_end"] - userStatus["total_start"];
		}
		delete userStatus["total_start"];
		delete userStatus["total_end"];
		delete userStatus[`session_data.session_id`];
		delete userStatus[`session_data.startTime`];
		delete userStatus[`session_data.endTime`];
	}
	return users;
}

export async function getUser(password) {
	// Uses a non-repeatable read due to READ COMMITTED isolation level being used to avoid locking
	const users = await User.findAll({
		where: {
			password: password
		},
		attributes: [
			"id",
			"first_name",
			"last_name",
			"session"
		],
		raw: true
	});

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
	// TODO: Clean up this validation
	const userArgs = [userObj["firstName"], userObj["lastName"], userObj["password"]]
		.map(arg => typeof arg === "string" ? arg.trim() : arg);

	if(!userArgs.every(arg => typeof arg === "string" && arg.trim().length > 0)) {
		const newUserError = new TypeError("User object must contain only nonempty strings for first name, last name, and password");
		newUserError.code = "user_data_not_nonempty_strings";
		throw newUserError;
	}

	const transaction = await db.transaction();
	try {
		await User.create({
			first_name: userArgs[0],
			last_name: userArgs[1],
			password: userArgs[2]
		}, {
			transaction: transaction
		});
		const newApiKey = makeNewApiKey();
		await ApiKey.create({
			password: userArgs[2],
			api_key: newApiKey
		}, {
			transaction: transaction
		});
		await transaction.commit();
	} catch(err) {
		console.log("[ROLLBACK] Failed to Create User", userObj);
		console.error(err);
		await transaction.rollback();
		throw err;
	}

	// Guaranteed to exist
	return (await User.findAll({
		where: {
			password: userArgs[2]
		},
		raw: true
	}))[0];
}

export async function changePassword(oldPassword, newPassword) {
	// Note: Leaks semi-sensitive information into logs
	if(!TESTING) {
		console.log(`Update ${oldPassword} to ${newPassword}`);
	}

	const conflictRows = await User.findAll({
		where: {
			password: newPassword
		},
		raw: true
	});
	if(conflictRows.length !== 0) {
		// Note: Leaks semi-sensitive information into logs
		if(!TESTING) {
			console.log(`Reject password change resulting in a collision for ${newPassword}`);
		}

		return {
			ok: false,
			error: "password_in_use"
		}
	}

	const transaction = await db.transaction();
	try {
		await User.update({
			password: newPassword
		}, {
			where: {
				password: oldPassword
			},
			transaction: transaction
		});

		await ApiKey.update({
			password: newPassword
		}, {
			where: {
				password: oldPassword
			},
			transaction: transaction
		});

		await Session.update({
			password: newPassword
		}, {
			where: {
				password: oldPassword
			},
			transaction: transaction
		});

		await transaction.commit();

		return {
			ok: true
		};
	} catch(err) {
		console.log("[ROLLBACK] Failed to Change Password");
		console.error(err);
		await transaction.rollback();

		return {
			ok: false
		};
	}
}

export async function deleteUser(password) {
	const transaction = await db.transaction();
	try {
		const deleteCount = await User.destroy({
			where: {
				password: password
			},
			transaction: transaction
		});
		if(deleteCount < 1) {
			const noUserError = new TypeError("No user with this password");
			noUserError.code = "already_deleted";
			throw noUserError;
		}

		await ApiKey.destroy({
			where: {
				password: password
			},
			transaction: transaction
		});

		await transaction.commit();
	} catch(err) {
		console.log("[ROLLBACK] Failed to delete user");
		console.error(err);
		await transaction.rollback();
		throw err;
	}
}

export async function listSessions(password) {
	const userSessions = await Session.findAll({
		where: {
			password: password
		},
		attributes: [
			"session_id",
			"startTime",
			"endTime"
		],
		raw: true
	});

	if(userSessions.length === 0) {
		if(!TESTING) console.warn("No sessions for user");
		return null;
	}
	return userSessions;
}

export async function getLatestSession(password) {
	const latestSessionRes = await Session.findAll({
		attributes: ["session_id", "startTime", "endTime"],
		where: {
			password: password
		},
		order: [["startTime", "DESC"]],
		limit: 1,
		raw: true
	});

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
export async function createSession(password, startTime, endTime = null, skipUpdate = false) {
	const newSession = await Session.create({
		password: password,
		startTime: startTime,
		endTime: endTime
	}, {
		raw: true
	});

	if(!skipUpdate) {
		await User.update(
			{
				session: newSession.session_id
			},
			{
				where: {
					password: password
				}
			}
		);
	}
	return newSession;
}

export async function patchSession(patchedSession) {
	// Uses session_id to patch startTime and endTime.
	// Password and session existence are not checked so ensure they are secure
	await Session.update({
		startTime: patchedSession["startTime"],
		endTime: patchedSession["endTime"]
	}, {
		where: {
			session_id: patchedSession["session_id"]
		}
	});
}

export async function deleteSession(sessionId) {
	const deletedCount = await Session.destroy({
		where: {
			session_id: sessionId
		}
	});

	if(deletedCount < 1) {
		const noDeleteErr = new RangeError("Session Not Found");
		noDeleteErr.code = "not_found";
		throw noDeleteErr;
	}

	// TODO: Handle edge case where the current session is deleted
}

export async function getSessions(count, offset) {
	const sessions = await Session.findAll({
		attributes: ["session_id", "startTime", "endTime"],
		order: [["session_id", "ASC"]],
		limit: count,
		offset: offset,
		raw: true
	});

	if(sessions.length === 0) {
		return null;
	}
	return sessions;
}
