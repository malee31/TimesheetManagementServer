jest.mock("../database/database-interface.js");

test("Empty Database Mock Working", async () => {
	const mockedDBI = require("../database/database-interface.js");
	expect(mockedDBI.isMocked).toBeTruthy();
	expect(await mockedDBI.getAllUsers()).toEqual([]);
});

// test("User Insert", () => {
// 	const mockedDBI = require("../database/database-interface.js");
//
// 	expect(() => mockedDBI.createUser({
// 		firstName: "mock",
// 		lastName: "test",
// 		password: "jest",
// 		session: null
// 	})).not.toThrow();
// });
//
// test("User Insert Fail", () => {
// 	const mockedDBI = require("../database/database-interface.js");
//
// 	expect(() => mockedDBI.createUser({})).rejects.toThrow();
// });