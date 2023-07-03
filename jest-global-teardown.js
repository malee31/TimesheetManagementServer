import fs from "fs";
import path from "path";

export default async function globalTeardown() {
	// TODO: Tear down the test environment in its entirety
	const nonceDir = global.nonceDir;
	const fileList = fs.readdirSync(nonceDir);
	if(fileList.length !== 1) {
		console.warn(`Global teardown expected only 1 file from global setup in ${nonceDir} but found ${fileList.length}`);
		console.warn("This implies that Jest has been run before and interrupted and did not fully teardown in the past");
		console.warn(`Ensure that your environment has been successfully wiped or rerun teardown alone a couple times and remove the extra files from ${nonceDir}`);
	}

	console.log(`Removing Nonce File from ${global.nonceFile}`);
	fs.rmSync(global.nonceFile);
}