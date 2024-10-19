/**
 * @file Loads in all configurations from .env files and re-exports them for other files to use
 * Cannot (or should not) be mocked out in testing since other testing utilities need this not to change.
 * If reconfiguration is needed for tests, use the `TESTING` constant or `testing.env` and `mock.env` to alter the values as that is set by the Jest test runner
 */

import * as dotenv from "dotenv";

export const TESTING = process.env.NODE_ENV === "test";
const originalEnv = dotenv.config().parsed;
if(TESTING) {
	const testingEnv = dotenv.config({ path: "testing.env", override: true }).parsed || {};

	// Ensures that at least one MYSQL env variable is overridden by testing.env
	const mysqlCredentialsChanged = Object.keys(testingEnv).some(testKey => testKey.startsWith("MYSQL_") && originalEnv[testKey] !== testingEnv[testKey]);
	if(!mysqlCredentialsChanged && process.env.ALLOW_TESTING_ON_PROD !== "true") {
		console.error("Refusing to run tests on the production database. At least one MYSQL configuration variable must differ in testing.env. \n(Set ALLOW_TESTING_ON_PROD to 'true' to override)");
		process.exit(1);
	}

	// Import all Jest environment variables and indicators
	// Slightly redundant but `testing.env` is included by git and mandatory but `mock.env` is not
	dotenv.config({ path: "mock.env", override: true });
}

// TODO: Consider not hard-coding the admin password in env
export const ADMIN_KEY = process.env.ADMIN_KEY;
export const API_PORT = process.env.API_PORT ?? 3000;
export const MYSQL_HOST = process.env.MYSQL_HOST;
export const MYSQL_USER = process.env.MYSQL_USER;
export const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD;
export const MYSQL_DATABASE = process.env.MYSQL_DATABASE;
export const PRODUCTION = process.env.NODE_ENV === "production";
