const mockedDatabaseInterface = require("../../test/mock-database-interface.js");

const mockedDBI = jest.createMockFromModule("../database-interface.js");
Object.assign(mockedDBI, mockedDatabaseInterface);

// TODO: Complete list of tasks
// - Create global setup and teardown for database
// - Insert fixtures into testing database
// - Consider unique tables for each instance with a mock function (Hard)
//   - Maybe implement by cloning a base table/dataset

module.exports = mockedDBI;