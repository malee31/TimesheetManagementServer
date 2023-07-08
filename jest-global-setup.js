import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { _globalTeardown } from "./jest-global-teardown.js";
import * as CONFIG from "./config.js";
import database from "./src/database/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if(!CONFIG.TESTING) {
	console.error("Setup is not being run in a testing environment (NODE_ENV should be set to 'test')");
	console.error("Shutting down to avoid modifying the wrong database");
	process.exit(1);
}

// Note: This function will NOT be under test coverage so redundant code SHOULD be used to ensure that everything is in order
//       Attempt to fix any failed checks internally and completely throw or exit the process if the fix cannot be applied
export default async function globalSetup() {
	await _setupNonce();

	// Creates tables
	await database.start();
	// All tests can now instantiate their own data with createUser() and createSession()
	// Tests may import convenience methods from this file's TEST_UTILS export
}

// Side effects: Sets paths in global (nonceDir and nonceFile) and sets global.setupUsed to true. Runs teardown if needed
async function _setupNonce() {
	global.setupUsed = true;
	global.nonceDir = path.resolve(__dirname, "private/nonce");
	global.nonceFile = path.resolve(global.nonceDir, `${uuidv4()}.txt`);

	const nonceDir = global.nonceDir;
	const fileList = fs.readdirSync(nonceDir);
	if(fileList.length) {
		console.warn(`Global setup expected only 1 file from global setup in ${nonceDir} but found ${fileList.length}`);
		console.warn("This implies that Jest has been run before and interrupted and did not fully teardown in the past");
		console.warn("Running global teardown prior to setup to start on a clean slate");
		await _globalTeardown(nonceDir);
	}

	console.log(`File inserted in ${global.nonceFile} to ensure that global setup only runs once`);

	if(!fs.existsSync(global.nonceDir)) {
		fs.mkdirSync(global.nonceDir, { recursive: true });
	}
	fs.writeFileSync(global.nonceFile, "This file existing indicates that Jest tests are either currently running or unexpectedly interrupted at some point.\nIn the case of the latter, you should run global teardown first");
}


// Convenience wrapper functions. These must NEVER FAIL and will NOT be unit tested. They should be simple wrappers with internal checks and throw on fail
// This function generates user details to use in tests with optional name overriding. Pass the output directly to createUser()
function generateTestUserObj(userNameOverrides) {
	// Ensure that the overrides aren't mis-keyed or typos
	const hasNonNameKey = Object.keys(userNameOverrides).some(key => !["firstName", "lastName"].includes(key));
	if(hasNonNameKey) {
		console.error(userNameOverrides);
		throw new TypeError("TestCaseError: An unknown key was found in the user object a test attempted to create");
	}

	// Returns the input to pass down to createUser() to actually create the user in the database
	return {
		firstName: userNameOverrides.firstName ?? "Test",
		lastName: userNameOverrides.lastName ?? "User",
		password: uuidv4()
	};
}

const HOUR_IN_MILLISECONDS = 60 * 60 * 1000;
// Generates times for createSession(). Map over createSession with (userObj.password, ...generateTimes()) in a Promise.All
// with the assumption that as the tester, you won't create multiple ongoing sessions
// Set nullEnd to true if a session is ongoing and stop adding sessions afterwards
//  optionally setting ongoing to true at the last call
// Beware of race conditions with ongoing=true (It should run after all other sessions are added)
function generateTimes(ongoing = false) {
	// Returns the input to pass down to createSession() to actually create the user in the database
	const startTime = Date.now();
	const generatedTimes = [startTime];
	generatedTimes.push(!ongoing ? startTime + HOUR_IN_MILLISECONDS : null);

	// In [startTime, endTime] format
	return generatedTimes;
}

// This is safe to import anywhere without dynamic require. Use these tools for dynamically creating test users and session in tests
export const TEST_UTILS = {
	generateTestUserObj,
	generateTimes
}