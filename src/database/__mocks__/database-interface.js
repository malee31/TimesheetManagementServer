const mockedDatabaseInterface = require("../../test/mock-database-interface.js");

const { TESTING } = require("../../../config.js");
const actualDatabase = require("../database.js").default;
const actualDBI = jest.requireActual("../database-interface.js");
const mockedDBI = jest.createMockFromModule("../database-interface.js");
Object.assign(mockedDBI, mockedDatabaseInterface);

// TODO: Complete list of tasks
// - Create global setup and teardown for database
// - Insert fixtures into testing database
// - Consider unique tables for each instance with a mock function (Hard)
//   - Maybe implement by cloning a base table/dataset

// A one-way conversion to using a real local testing DB for operations
mockedDBI.setupTestingDatabase = async () => {
	if(!TESTING) {
		throw new Error("Refusing to connect to Production DB in testing");
	}
	Object.assign(mockedDBI, actualDBI);
	await actualDatabase.start();
}

module.exports = mockedDBI;