describe("API Key Generation", () => {
	it("Starts with 'U-'", () => {
		const { makeNewApiKey } = require("./apiKey.js");
		const newApiKey = makeNewApiKey();
		expect(newApiKey).toStartWith("U-");
		expect(newApiKey.length).toBeGreaterThan(2);
	});
});