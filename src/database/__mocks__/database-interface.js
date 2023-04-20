console.log("MOCK")
const mockedDatabaseInterface = require("../../test/mock-database-interface.js");

const mockedDBI = jest.createMockFromModule("../database-interface.js");
Object.assign(mockedDBI, mockedDatabaseInterface);

module.exports = mockedDBI;