/**
 * @file
 * This file is stateless and safe to import anywhere without a dynamic require.
 * It does utilize the `mysql` specific feature of an `insertId` being provided on insert to look up the last inserted row. See the SQL `OUTPUT` keyword for other languages
 * Use these tools for dynamically creating test users and session in tests (Although they could be used for quick scripts).
 * These must NEVER FAIL and will NOT be unit tested. They should be simple wrappers with internal checks and throw/crash on fail
 * This file ONLY depends on the `uuid` and `database.js` imports and DOES generate random passwords and api_keys.
 *     IMPORTANT: This randomness should never be an issue unless dashes are one day not allowed in one or the other
 *                Randomness was a questionable design decision and may be removed in a future commit
 */

// This function generates user details to use in tests with optional name overriding. Pass the output directly to createUser()
import { v4 as uuidv4 } from "uuid";
import db from "../database/database.js";
import tableNames from "../database/table-names.js";
import { QueryTypes } from "sequelize";

export function generateTestUserObj(firstName = "Test", lastName = "User") {
	if(typeof firstName !== "string" || typeof lastName !== "string") throw TypeError("Name overrides must be strings");
	if(firstName.trim().length === 0 || lastName.trim().length === 0) throw TypeError("Name overrides cannot be blank");

	// Returns the input to pass down to createUser() to actually create the user in the database
	return {
		firstName: firstName,
		lastName: lastName,
		password: uuidv4()
	};
}

// You may change this any time. The test logs may change but the results shouldn't
// This is just to hard-code a start time for test users' generated times
export const GENERATED_START_DATE_MILLIS = (new Date("2023-01-01T00:00:00")).getTime();
export const HOUR_IN_MILLISECONDS = 60 * 60 * 1000;
// Generates the inputs to feed into createSession(). This util should be updated if createSession() changes its signature
// Create a number of sessions with await Promise.all(generateTimes(...).map(createSession)
export function generateTimes(password, numSessions = 1, ongoing = false) {
	if(typeof password !== "string" || password.trim().length === 0) throw TypeError("Password must exist and be a string");
	if(numSessions < 1) throw RangeError("At least 1 session required if calling generateTimes()");
	// Move the start date to the beginning of the year
	const generatedTimes = [];
	for(let sessionNum = 0; sessionNum < numSessions; sessionNum++) {
		// All sessions will be 1 hour long and have start times 2 hours apart from each other
		// First session will always start on GENERATED_START_DATE_MILLIS
		const startTime = GENERATED_START_DATE_MILLIS + 2 * sessionNum * HOUR_IN_MILLISECONDS;
		const sessionParams = [password, startTime, startTime + HOUR_IN_MILLISECONDS, true];
		if(sessionNum === numSessions - 1) {
			// Last session
			if(ongoing) sessionParams[2] = null;  // Remove endTime if the session is ongoing
			sessionParams[3] = false;  // Allow making this session the latest session
		}
		generatedTimes.push(sessionParams);
	}

	// In [[<createSession() Params>], [<createSession() Params>]] format
	return generatedTimes;
}

// Safe assumption made that database.start() has already been called and the tables exist
// These directly insert into the database without question
// TODO: Database insert functionality without relying on database-interface.js
export async function insertTestUser(testUserObj) {
	// Schema dependent. Modify if schema ever changes
	// Note: Conflicts are disallowed on a database level
	const [insertId] = await db.query(`INSERT INTO ${tableNames.users} (first_name, last_name, password)
                                       VALUES (?, ?, ?)`, {
		type: QueryTypes.INSERT,
		replacements: [testUserObj.firstName, testUserObj.lastName, testUserObj.password]
	});
	if(!insertId >= 1) {
		throw new Error("Invalid id from an INSERT");
	}

	return (await db.query(`SELECT *
                            FROM ${tableNames.users}
                            WHERE id = ?`, {
		type: QueryTypes.SELECT,
		replacements: [insertId]
	}))[0];  // Returns entry given the ID
}

export async function insertTestSession(_testSessionObj) {
	if(Array.isArray(_testSessionObj) && Array.isArray(_testSessionObj[0])) {
		// Unpack the array if multiple sessions are to be inserted
		// Run serially rather than in parallel
		const insertedSessions = [];
		for(const testSessionObj of _testSessionObj) {
			insertedSessions.push(await insertTestSession(testSessionObj));
		}
		return insertedSessions;
	}

	// Schema dependent. Modify if schema ever changes
	const [insertSessionId] = await db.query(`INSERT INTO ${tableNames.sessions} (password, startTime, endTime)
                                                  VALUES (?, ?, ?)`, {
		type: QueryTypes.INSERT,
		replacements: _testSessionObj
	});
	// Sanity check
	if(insertSessionId < 1) throw new Error(`Invalid Inserted Session Row Id: ${insertSessionId}`);

	return (await db.query(`SELECT *
                            FROM ${tableNames.sessions}
                            WHERE session_id = ?`, {
		type: QueryTypes.SELECT,
		replacements: [insertSessionId]
	}))[0];  // Returns entry given the ID
}

export async function associateSession(password, sessionId) {
	// TODO: Check for errors and success
	const [_, sessionAffectedRows] = await db.query(`UPDATE ${tableNames.users}
                                                     SET session = ?
                                                     WHERE password = ?`, {
		type: QueryTypes.UPDATE,
		replacements: [sessionId, password]
	});
	if(sessionAffectedRows !== 1) throw new Error(`Affected Rows should be 1 after insert: ${sessionAffectedRows}`);

	return (await db.query(`SELECT *
                            FROM ${tableNames.users}
                            WHERE password = ?`, {
		type: QueryTypes.SELECT,
		replacements: [password]
	}))[0];  // Returns modified user entry
}

export async function insertApiKey(password, apiKey, revoked) {
	if(!apiKey.startsWith("U-")) {
		throw new TypeError("API Key must start with 'U-'");
	}

	// TODO: Check for errors and success
	let apiKeyInsertId;
	if(revoked !== undefined) {
		[apiKeyInsertId] = await db.query(`INSERT INTO ${tableNames.api_keys} (password, api_key, revoked)
                                           VALUES (?, ?, ?)`, {
			type: QueryTypes.INSERT,
			replacements: [password, apiKey, revoked]
		});
	} else {
		[apiKeyInsertId] = await db.query(`INSERT INTO ${tableNames.api_keys} (password, api_key)
                                           VALUES (?, ?)`, {
			type: QueryTypes.INSERT,
			replacements: [password, apiKey]
		});
	}
	// Sanity check
	if(apiKeyInsertId < 1) throw new Error(`Invalid API Key Row ID after insert: ${apiKeyInsertId}`);

	return (await db.query(`SELECT *
                            FROM ${tableNames.api_keys}
                            WHERE id = ?`, {
		type: QueryTypes.SELECT,
		replacements: [apiKeyInsertId]
	}))[0];  // Returns modified user entry
}