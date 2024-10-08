import db from "../database/database.js";
import tableNames from "../database/table-names.js";
import { associateSession, insertApiKey, insertTestSession, insertTestUser } from "./testUtils.js";
import { QueryTypes } from "sequelize";

// Note: This file has a few lines of code repeated from the source of testUtils.js but that is intentional
//       That way, even if the testUtils source code changes, the tests will not couple and depend on each other

const SESSION_OFFSET = 30 * 60 * 60 * 1000;  // +30 minutes

describe("User Test Utility Inserts As Intended", () => {
	it("Inserts non-pre-existing user", async () => {
		const password = "testUtils-user-password-entry-1";

		const existenceCheckBefore = await db.query(`SELECT *
                                                     FROM ${tableNames.users}
                                                     WHERE password = ?`, {
			type: QueryTypes.SELECT,
			replacements: [password]
		});
		expect(existenceCheckBefore.length).toBe(0);

		await insertTestUser({
			firstName: "Test Util New User",
			lastName: "Test",
			password: password
		});

		const existenceCheckAfter = await db.query(`SELECT *
                                                    FROM ${tableNames.users}
                                                    WHERE password = ?`, {
			type: QueryTypes.SELECT,
			replacements: [password]
		});
		expect(existenceCheckAfter.length).toBe(1);
	});

	it("Refuses pre-existing user", async () => {
		const password = "testUtils-user-password-entry-2";

		const existenceCheckBefore = await db.query(`SELECT 1
                                                     FROM ${tableNames.users}
                                                     WHERE password = ?`, {
			type: QueryTypes.SELECT,
			replacements: [password]
		});
		expect(existenceCheckBefore.length).toBe(0);

		await insertTestUser({
			firstName: "Test Util New User Conflict",
			lastName: "Test",
			password: password
		});

		const duplicateInsertErr = await insertTestUser({
			firstName: "Test Util New User",
			lastName: "Test",
			password: password
		}).catch(err => err);

		expect(duplicateInsertErr.name).toBe("SequelizeUniqueConstraintError");

		const existenceCheckAfter = await db.query(`SELECT 1
                                                    FROM ${tableNames.users}
                                                    WHERE password = ?`, {
			type: QueryTypes.SELECT,
			replacements: [password]
		});
		expect(existenceCheckAfter.length).toBe(1);
	});
});

describe("API Key Test Utility Inserts As Intended", () => {
	it("Rejects invalid API keys", async () => {
		expect(insertApiKey("irrelevant-password", "invalid-api-key")).toReject(TypeError)
	});

	it("Inserts new API key", async () => {
		const password = "testUtils-api-key-password-entry-1";
		const apiKey = "U-testUtils-api-key-1";

		const existenceCheckBefore = await db.query(`SELECT 1
                                                     FROM ${tableNames.api_keys}
                                                     WHERE password = ?`, {
			type: QueryTypes.SELECT,
			replacements: [password]
		});
		expect(existenceCheckBefore.length).toBe(0);

		const insertedApiKey = await insertApiKey(password, apiKey);
		expect(insertedApiKey.id).toBeGreaterThan(0);
		expect(insertedApiKey.api_key).toBeString();
		expect(insertedApiKey.revoked).toBeFalsy();

		// Also checks revoked false
		const existenceCheckAfter = await db.query(`SELECT 1
                                                    FROM ${tableNames.api_keys}
                                                    WHERE password = ?
                                                      AND revoked = FALSE`, {
			type: QueryTypes.SELECT,
			replacements: [password]
		});
		expect(existenceCheckAfter.length).toBe(1);
	});

	it("Inserts revoked API key", async () => {
		const password = "testUtils-api-key-password-entry-2";
		const apiKey = "U-testUtils-api-key-2";

		const existenceCheckBefore = await db.query(`SELECT 1
                                                     FROM ${tableNames.api_keys}
                                                     WHERE password = ?`, {
			type: QueryTypes.SELECT,
			replacements: [password]
		}, true);
		expect(existenceCheckBefore.length).toBe(0);

		const insertedApiKey = await insertApiKey(password, apiKey, true);
		expect(insertedApiKey.id).toBeGreaterThan(0);
		expect(insertedApiKey.api_key).toBeString();
		expect(insertedApiKey.revoked).toBeTruthy();

		// Also checks revoked true
		const existenceCheckAfter = await db.query(`SELECT 1
                                                    FROM ${tableNames.api_keys}
                                                    WHERE password = ?
                                                      AND revoked = TRUE`, {
			type: QueryTypes.SELECT,
			replacements: [password]
		});
		expect(existenceCheckAfter.length).toBe(1);
	});

	it("Inserts multiple API keys", async () => {
		// Note: This may hang Jest with larger numbers but the test passes. The hang is likely due to MySQL pools
		const NUM_KEYS = 10;
		const password = "testUtils-api-key-password-entry-3";
		const apiKeys = Array(NUM_KEYS).fill(0).map((_, index) => {
			return `U-testUtils-api-key-multiple-${index}`;
		});

		const existenceCheckBefore = await db.query(`SELECT 1
                                                     FROM ${tableNames.api_keys}
                                                     WHERE password = ?`, {
			type: QueryTypes.SELECT,
			replacements: [password]
		});
		expect(existenceCheckBefore.length).toBe(0);

		const insertedApiKeys = await Promise.all(apiKeys.map(key => insertApiKey(password, key)));
		expect(insertedApiKeys.length).toBe(NUM_KEYS);
		expect(insertedApiKeys[0].id).toBeGreaterThan(0);
		expect(insertedApiKeys[0].api_key).toBeString();

		const existenceCheckAfter = await db.query(`SELECT 1
                                                    FROM ${tableNames.api_keys}
                                                    WHERE password = ?`, {
			type: QueryTypes.SELECT,
			replacements: [password]
		});
		expect(existenceCheckAfter.length).toBe(NUM_KEYS);
	});
});

describe("Session Test Utility Inserts As Intended", () => {
	it("Inserts new session", async () => {
		const password = "testUtils-session-password-entry-1";
		const startTime = new Date("January 1, 2000 12:00:00").getTime();
		const endTime = startTime + SESSION_OFFSET;

		const existenceCheckBefore = await db.query(
			`SELECT 1
             FROM ${tableNames.sessions}
             WHERE password = ?`, {
				type: QueryTypes.SELECT,
				replacements: [password]
			});
		expect(existenceCheckBefore.length).toBe(0);

		const insertedSession = await insertTestSession([password, startTime, endTime]);
		expect(insertedSession.session_id).toBeGreaterThan(0);

		const existenceCheckAfter = await db.query(`SELECT 1
                                                    FROM ${tableNames.sessions}
                                                    WHERE password = ?`, {
			type: QueryTypes.SELECT,
			replacements: [password]
		});
		expect(existenceCheckAfter.length).toBe(1);
	});

	it("Inserts multiple new sessions", async () => {
		const password = "testUtils-session-password-entry-2";
		const startTime = new Date("January 2, 2000 12:00:00").getTime();
		const endTime = startTime + SESSION_OFFSET;  // +30 minutes
		const numSessions = 10;

		const existenceCheckBefore = await db.query(`SELECT 1
                                                     FROM ${tableNames.sessions}
                                                     WHERE password = ?`, {
			type: QueryTypes.SELECT,
			replacements: [password]
		});
		expect(existenceCheckBefore.length).toBe(0);

		const insertedSessions = await insertTestSession(Array(numSessions).fill(0).map((_, index) => (
			[password, startTime + index * SESSION_OFFSET, endTime + index * SESSION_OFFSET]
		)));
		expect(insertedSessions.length).toBe(numSessions);
		expect(insertedSessions[0].session_id).toBeGreaterThan(0);

		const existenceCheckAfter = await db.query(`SELECT 1
                                                    FROM ${tableNames.sessions}
                                                    WHERE password = ?`, {
			type: QueryTypes.SELECT,
			replacements: [password]
		});
		expect(existenceCheckAfter.length).toBe(numSessions);
	});
});

describe("Session Association Test Utility Updates As Intended", () => {
	it("Associates new session", async () => {
		const password = "testUtils-session-associate-password-entry-1";
		// Create a user
		const [insertUserId] = await db.query(`INSERT INTO ${tableNames.users} (first_name, last_name, password)
                                               VALUES (?, ?, ?)`, {
			type: QueryTypes.INSERT,
			replacements: ["Test Util Session Association", "User", password]
		});
		expect(insertUserId).toBeGreaterThan(0);

		const existenceCheckBefore = await db.query(`SELECT 1
                                                     FROM ${tableNames.sessions}
                                                     WHERE password = ?`, {
			type: QueryTypes.SELECT,
			replacements: [password]
		});
		expect(existenceCheckBefore.length).toBe(0);

		const startTime = new Date("January 2, 2000 12:00:00").getTime();
		const endTime = startTime + SESSION_OFFSET;  // +30 minutes
		const [sessionInsertId] = await db.query(`INSERT INTO ${tableNames.sessions} (password, startTime, endTime)
                                                  VALUES (?, ?, ?)`, {
			type: QueryTypes.INSERT,
			replacements: [password, startTime, endTime]
		});
		expect(sessionInsertId).toBeGreaterThan(0);

		const sessionIdRes = await db.query(`SELECT session_id
                                             FROM ${tableNames.sessions}
                                             WHERE password = ?
                                               AND startTime = ?
                                               AND endTime = ?`, {
			type: QueryTypes.SELECT,
			replacements: [password, startTime, endTime]
		});
		const associateSessionId = sessionIdRes[0].session_id;
		expect(associateSessionId).toEqual(expect.any(Number));

		const associatedUser = await associateSession(password, associateSessionId);
		expect(associatedUser.id).toBeGreaterThan(0);
		expect(associatedUser.password).toBe(password);

		const associateCheckRes = await db.query(`SELECT session
                                                  FROM ${tableNames.users}
                                                  WHERE password = ?`, {
			type: QueryTypes.SELECT,
			replacements: [password]
		});
		expect(associateCheckRes[0].session).toEqual(associateSessionId);
	});

	it("Refuses to associate non-existent session", async () => {
		const password = "testUtils-session-associate-password-entry-2";

		const lastSessionId = await db.query(`SELECT session_id
                                              FROM ${tableNames.sessions}
                                              ORDER BY session_id DESC
                                              LIMIT 1`, {
			type: QueryTypes.SELECT
		});
		const nonexistentSessionId = lastSessionId + 1;

		const sessionNonexistenceCheck = await db.query(`SELECT 1
                                                         FROM ${tableNames.sessions}
                                                         WHERE session_id = ?`, {
			type: QueryTypes.SELECT,
			replacements: [nonexistentSessionId]
		});
		expect(sessionNonexistenceCheck.length).toBe(0);

		const associateNonexistentPromise = associateSession(password, nonexistentSessionId);
		expect(associateNonexistentPromise).toReject();
	});
});