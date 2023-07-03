import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function globalSetup() {
	// TODO: Check for test environment and tear it down if it exists. Then set one up
	// Note: This function will NOT be under test coverage so redundant code SHOULD be used to ensure that everything is in order
	//       Attempt to fix any failed checks internally and completely throw or exit the process if the fix cannot be applied
	global.setupUsed = true;
	global.nonceDir = path.resolve(__dirname, "private/nonce");
	global.nonceFile = path.resolve(global.nonceDir, `${uuidv4()}.txt`);

	const nonceDir = global.nonceDir;
	const fileList = fs.readdirSync(nonceDir);
	if(fileList.length) {
		console.warn(`Global setup expected only 1 file from global setup in ${nonceDir} but found ${fileList.length}`);
		console.warn("This implies that Jest has been run before and interrupted and did not fully teardown in the past");
		console.warn(`Ensure that your environment has been successfully wiped or rerun teardown alone a couple times and remove the extra files from ${nonceDir}`);
		console.warn("You have 6 seconds to Ctrl+C to ensure everything has been reset before global setup begins");
		await new Promise(resolve => setTimeout(resolve, 6000));
	}

	console.log(`File inserted in ${global.nonceFile} to ensure that global setup only ran once`);

	if(!fs.existsSync(global.nonceDir)) {
		fs.mkdirSync(global.nonceDir, { recursive: true });
	}
	fs.writeFileSync(global.nonceFile, "This file existing indicates that Jest tests are either currently running or unexpectedly interrupted at some point.\nIn the case of the latter, you should run global teardown first");
}