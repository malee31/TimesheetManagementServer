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
	// Tests may import convenience methods from testUtils.js
}

// Side effects: Sets paths in global (nonceDir and nonceFile) and sets global.setupUsed to true. Runs teardown if needed
async function _setupNonce() {
	global.nonceDir = path.resolve(__dirname, "private/nonce");
	global.nonceFile = path.resolve(global.nonceDir, `${uuidv4()}.txt`);

	if(!fs.existsSync(global.nonceDir)) {
		fs.mkdirSync(global.nonceDir, { recursive: true });
	}

	const nonceDir = global.nonceDir;
	const fileList = fs.readdirSync(nonceDir);
	if(fileList.length) {
		console.warn(`Global setup expected only 1 file from global setup in ${nonceDir} but found ${fileList.length}`);
		console.warn("This implies that Jest has been run before and interrupted and did not fully teardown in the past");
		console.warn("Running global teardown prior to setup to start on a clean slate");
		await _globalTeardown(nonceDir);
	}

	// console.log(`\nFile inserted in ${global.nonceFile} to ensure that global setup only runs once`);

	fs.writeFileSync(global.nonceFile, "This file existing indicates that Jest tests are either currently running or unexpectedly interrupted at some point.\nIn the case of the latter, you should run global teardown first");
	global.setupUsed = true;
}