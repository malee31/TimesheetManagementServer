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
	global.nonceDir = path.resolve(__dirname, "private/nonce");
	global.nonceFile = path.resolve(global.nonceDir, `${uuidv4()}.txt`);

	console.log(`File inserted in ${global.nonceFile} to ensure that global setup only ran once`);

	if (!fs.existsSync(global.nonceDir)) {
		fs.mkdirSync(global.nonceDir);
	}
	fs.writeFileSync(global.nonceFile, "test");
}