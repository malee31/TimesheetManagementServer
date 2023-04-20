const mockedDatabaseInterface = require("../../test/mock-database-interface.js");

const mockedDBI = jest.createMockFromModule("../database-interface.js");
Object.assign(mockedDBI, mockedDatabaseInterface);

// Note: Test all inserts and other functions before using. Assumes all function work
// Take care when modifying the sample data to make sure that unique ids remain unique and relations are properly made
mockedDBI.setSampleData = () => {
	const data = mockedDBI.mock_data;
	const tables = data.tables;
	const ids = data.ids;

	const makeUser = (id, first, last, password, session = null) => ({
		id: id,
		first_name: first,
		last_name: last,
		password: password,
		session: session
	});

	const makeSession = (id, password, start, end = null) => ({
		session_id: id,
		password: password,
		startTime: start,
		endTime: end
	});

	const makeKey = (id, password, key, revoke = false) => ({
		id: id,
		password: password,
		api_key: key,
		revoked: revoke
	});

	tables.users = [
		makeUser(1, "test-a", "last-a", "pw-a"),
		makeUser(2, "test-b", "last-b", "pw-b"),
		makeUser(3, "test-c", "last-c", "pw-c")
	];

	tables.sessions = [
		// On the dot for 30 minutes
		makeSession(1, "pw-a", 1681887600000, 1681887600000 + 30 * 60 * 1000),
		// 1 minute after for 30 minutes
		makeSession(2, "pw-b", 1681887660000, 1681887660000 + 30 * 60 * 1000),
		// 1 hour after for 1 hour
		makeSession(3, "pw-c", 1681891200000, 1681891200000 + 60 * 60 * 1000),
		// 2 hours after indefinitely
		makeSession(4, "pw-c", 1681894800000)
	];

	tables.apiKeys = [
		makeKey(1, "pw-a", "U-User-A-Key"),
		makeKey(2, "pw-b", "U-User-B-Key"),
		makeKey(3, "pw-c", "U-User-C-Old-Key", true),
		makeKey(4, "pw-c", "U-User-C-Old-Key")
	];

	// Fix auto-indices
	ids.users = Math.max(ids.users, tables.users.reduce((acc, val) => Math.max(acc, val.id), 1));
	ids.sessions = Math.max(ids.sessions, tables.sessions.reduce((acc, val) => Math.max(acc, val.session_id), 1));
	ids.apiKeys = Math.max(ids.apiKeys, tables.apiKeys.reduce((acc, val) => Math.max(acc, val.id), 1));
}

module.exports = mockedDBI;