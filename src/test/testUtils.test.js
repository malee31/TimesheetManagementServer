import database from "../database/database.js";
import tableNames from "../database/table-names.js";

describe("User Test Utility Inserts As Intended", () => {
	let insertUserUtil;
	beforeAll(() => {
		insertUserUtil = global._utils.insertTestUser;
	});

	it("Inserts non-pre-existing user", async () => {
		const password = "testUtils-user-password-entry-1";

		const existenceCheckBefore = await database.singleQueryPromisify(`SELECT 1 FROM ${tableNames.users} WHERE password = ?`, [password], true);
		expect(existenceCheckBefore.length).toBe(0);

		await insertUserUtil({
			firstName: "Test Util New User",
			lastName: "Test",
			password: password
		});

		const existenceCheckAfter = await database.singleQueryPromisify(`SELECT 1 FROM ${tableNames.users} WHERE password = ?`, [password], true);
		expect(existenceCheckAfter.length).toBe(1);
	});

	it("Refuses pre-existing user", async () => {
		const password = "testUtils-user-password-entry-2";

		const existenceCheckBefore = await database.singleQueryPromisify(`SELECT 1 FROM ${tableNames.users} WHERE password = ?`, [password], true);
		expect(existenceCheckBefore.length).toBe(0);

		await insertUserUtil({
			firstName: "Test Util New User Conflict",
			lastName: "Test",
			password: password
		});

		const duplicateInsertErr = await insertUserUtil({
			firstName: "Test Util New User",
			lastName: "Test",
			password: password
		}).catch(err => err);

		expect(duplicateInsertErr.code).toBe("ER_DUP_ENTRY");

		const existenceCheckAfter = await database.singleQueryPromisify(`SELECT 1 FROM ${tableNames.users} WHERE password = ?`, [password], true);
		expect(existenceCheckAfter.length).toBe(1);
	});
});

describe("API Key Test Utility Inserts As Intended", () => {
	let insertApiKeyUtil;
	beforeAll(() => {
		insertApiKeyUtil = global._utils.insertApiKey;
	});

	it("Rejects invalid API keys", async () => {
		expect(insertApiKeyUtil("irrelevant-password", "invalid-api-key")).toReject(TypeError)
	})

	it("Inserts new API key", async () => {
		const password = "testUtils-api-key-password-entry-1";
		const apiKey = "U-testUtils-api-key-1";

		const existenceCheckBefore = await database.singleQueryPromisify(`SELECT 1 FROM ${tableNames.api_keys} WHERE password = ?`, [password], true);
		expect(existenceCheckBefore.length).toBe(0);

		await insertApiKeyUtil(password, apiKey);

		// Also checks revoked false
		const existenceCheckAfter = await database.singleQueryPromisify(`SELECT 1 FROM ${tableNames.api_keys} WHERE password = ? AND revoked = FALSE`, [password], true);
		expect(existenceCheckAfter.length).toBe(1);
	});

	it("Inserts revoked API key", async () => {
		const password = "testUtils-api-key-password-entry-2";
		const apiKey = "U-testUtils-api-key-2";

		const existenceCheckBefore = await database.singleQueryPromisify(`SELECT 1 FROM ${tableNames.api_keys} WHERE password = ?`, [password], true);
		expect(existenceCheckBefore.length).toBe(0);

		await insertApiKeyUtil(password, apiKey, true);

		// Also checks revoked true
		const existenceCheckAfter = await database.singleQueryPromisify(`SELECT 1 FROM ${tableNames.api_keys} WHERE password = ? AND revoked = TRUE`, [password], true);
		expect(existenceCheckAfter.length).toBe(1);
	});

	it("Inserts multiple API keys", async () => {
		// Note: This may hang Jest with larger numbers but the test passes. The hang is likely due to MySQL pools
		const NUM_KEYS = 10;
		const password = "testUtils-api-key-password-entry-3";
		const apiKeys = Array(NUM_KEYS).fill(0).map((_, index) => {
			return `U-testUtils-api-key-multiple-${index}`;
		});

		const existenceCheckBefore = await database.singleQueryPromisify(`SELECT 1 FROM ${tableNames.api_keys} WHERE password = ?`, [password], true);
		expect(existenceCheckBefore.length).toBe(0);

		await Promise.all(apiKeys.map(key => insertApiKeyUtil(password, key)));

		const existenceCheckAfter = await database.singleQueryPromisify(`SELECT 1 FROM ${tableNames.api_keys} WHERE password = ?`, [password], true);
		expect(existenceCheckAfter.length).toBe(NUM_KEYS);
	}, 10000);
});

describe("Session Test Utility Inserts As Intended", () => {
	const sessionOffset = 30 * 60 * 60 * 1000;  // +30 minutes
	let insertSessionUtil;
	beforeAll(() => {
		insertSessionUtil = global._utils.insertTestSession;
	});

	it("Inserts new session", async () => {
		const password = "testUtils-session-password-entry-1";
		const startTime = new Date("January 1, 2000 12:00:00").getTime();
		const endTime = startTime + sessionOffset;

		const existenceCheckBefore = await database.singleQueryPromisify(`SELECT 1 FROM ${tableNames.sessions} WHERE password = ?`, [password], true);
		expect(existenceCheckBefore.length).toBe(0);

		await insertSessionUtil([password, startTime, endTime]);

		const existenceCheckAfter = await database.singleQueryPromisify(`SELECT 1 FROM ${tableNames.sessions} WHERE password = ?`, [password], true);
		expect(existenceCheckAfter.length).toBe(1);
	});

	it("Inserts multiple new sessions", async () => {
		const password = "testUtils-session-password-entry-2";
		const startTime = new Date("January 2, 2000 12:00:00").getTime();
		const endTime = startTime + sessionOffset;  // +30 minutes
		const numSessions = 10;

		const existenceCheckBefore = await database.singleQueryPromisify(`SELECT 1 FROM ${tableNames.sessions} WHERE password = ?`, [password], true);
		expect(existenceCheckBefore.length).toBe(0);

		await insertSessionUtil(Array(numSessions).fill(0).map((_, index) => (
			[password, startTime + index * sessionOffset, endTime + index * sessionOffset]
		)));

		const existenceCheckAfter = await database.singleQueryPromisify(`SELECT 1 FROM ${tableNames.sessions} WHERE password = ?`, [password], true);
		expect(existenceCheckAfter.length).toBe(numSessions);
	});
});

describe("Session Association Test Utility Updates As Intended", () => {
	it("Associates new session", async () => {

	});

	it("Refuses to associate non-existent session", async () => {

	});
});