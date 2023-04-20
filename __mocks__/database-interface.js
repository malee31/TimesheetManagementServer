console.log("MOCK")
jest.createMockFromModule("../src/database/database-interface.js");
const mockedDatabaseInterface = require("../src/test/mock-database-interface.js");

const mockedDBI = jest.createMockFromModule("../src/database/database-interface.js");
Object.assign(mockedDBI, mockedDatabaseInterface);

module.exports = mockedDBI;