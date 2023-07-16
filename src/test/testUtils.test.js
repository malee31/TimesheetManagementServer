import database from "../database/database.js";
import tableNames from "../database/table-names.js";

describe("User Test Utility Inserts As Intended", () => {
	it("Inserts non-pre-existing user", async () => {

	});

	it("Refuses pre-existing user", async () => {

	});
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

describe("API Key Test Utility Inserts As Intended", () => {
	it("Inserts new API key", async () => {

	});

	it("Inserts revoked API key", async () => {

	});

	it("Inserts multiple API keys", async () => {

	})
});