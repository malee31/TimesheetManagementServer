/**
 * @file
 * This file is safe to import anywhere without dynamic require.
 * Use these tools for dynamically creating test users and session in tests.
 * This file ONLY depends on the uuid import and DOES generate random passwords and api_keys.
 *     IMPORTANT: This randomness should never be an issue unless dashes are one day not allowed in one or the other
 */

// Convenience wrapper functions. These must NEVER FAIL and will NOT be unit tested. They should be simple wrappers with internal checks and throw on fail
// This function generates user details to use in tests with optional name overriding. Pass the output directly to createUser()
import { v4 as uuidv4 } from "uuid";

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
const GENERATED_START_DATE_MILLIS = (new Date("2023-01-01T00:00:00")).getTime();
const HOUR_IN_MILLISECONDS = 60 * 60 * 1000;
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