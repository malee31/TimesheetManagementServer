import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export default async function globalTeardown() {
	// TODO: Tear down the test environment in its entirety
	if(!global.setupUsed) {
		throw new Error("This function should only be run by Jest. Use _globalTeardown() instead");
	}

	await _globalTeardown(path.dirname(global.nonceFile), global.nonceFile);
}

export async function _globalTeardown(nonceDir, nonceFile = "") {
	console.log("===== Teardown Start =====");
	// TODO: Actual teardown

	if(nonceFile) {
		console.log(`Removing Nonce File from ${nonceFile}`);
		fs.rmSync(nonceFile);
	}


	console.log("Wiping contents of nonce directory so that setup doesn't complain about teardown not being run next time");
	const nonceContents = fs.readdirSync(nonceDir);
	for(const nonceFile of nonceContents) {
		const noncePath = path.resolve(nonceDir, nonceFile);
		fs.rmSync(noncePath);
		console.log(`Wiped: ${noncePath}`);
	}
	console.log("Successfully wiped nonce directory");

	console.log("===== Teardown Success =====");
}

// Run teardown directly if running directly from command line with `node jest-global-teardown.js`
if(path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);
	const nonceDir = path.resolve(__dirname, "private/nonce");

	console.log("Beginning Teardown ONLY");

	globalTeardown()
		.then(() => {
			console.log("Teardown Complete");
			console.log("Wiping contents of nonce directory so that setup doesn't complain about teardown not being run next time");

			const nonceContents = fs.readdirSync(nonceDir);
			for(const nonceFile of nonceContents) {
				fs.rmSync(path.resolve(nonceDir, nonceFile));
			}
			console.log("Successfully wiped nonce directory");
		})
		.catch(err => {
			console.warn("Teardown failed:");
			console.error(err);
		});
}
