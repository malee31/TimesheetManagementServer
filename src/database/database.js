/**
 * @file Database Wrapper
 * Contains the setup and teardown functions for Sequelize and exports a client for the `database-interface.js` to use.
 *
 * This is a separate file for legacy reasons.
 * This used to contain wrapper functions around `mysql` to covert its methods into Promises.
 * That functionality has been superseded with the use of the Sequelize ORM.
 * A (relatively) low-level wrapper around the database to create Promises out of database queries.
 * Other libraries like `mysql2` contain these features but `mysql` is being used for legacy reasons at the moment.
 * Note: This file does not have a dedicated test script. It is mostly assumed to either work or completely crash.
 *       It is indirectly unit tested lightly by other tests that use these functions to set themselves up
 */

// Configure SQL credentials from environment variables
import { Sequelize } from "sequelize";
import tableNames from "./table-names.js";
import schemas from "./table-schemas.js";
import { MYSQL_DATABASE, MYSQL_HOST, MYSQL_PASSWORD, MYSQL_USER, TESTING } from "../../config.js";

// Note: Before use, guarantee that the connection is active and the tables have been set up by calling start()
//       Beware that calling start() is *NOT* mandatory by design and not guaranteed to be called before all other functions
const sequelize = new Sequelize(MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD, {
	dialect: "mysql",
	host: MYSQL_HOST,
	connectionLimit: 10,
	queueLimit: 20,
	waitForConnections: true,
	logging: false
});

// Generates tables if they do not exist
// WARNING: Will not modify tables with an updated schema if they already exist
async function createTables() {
	const sessionsTableCreate = singleQueryPromisify(schemas.sessions);
	const apiKeysTableCreate = singleQueryPromisify(schemas.apiKeys);
	// The sessions table must be created before the users table
	await sessionsTableCreate;
	const usersTableCreate = singleQueryPromisify(schemas.users);

	await Promise.all([
		usersTableCreate,
		apiKeysTableCreate
	]);
}

// Purges all tables and data
// Restarting the server should regenerate new tables using createTables()
async function dropTables() {
	const usersTableDrop = singleQueryPromisify(`DROP TABLE IF EXISTS ${tableNames.users}`);
	const apiKeysTableDrop = singleQueryPromisify(`DROP TABLE IF EXISTS ${tableNames.api_keys}`);
	// The users table must be dropped before the sessions table
	await usersTableDrop;
	const sessionsTableDrop = singleQueryPromisify(`DROP TABLE IF EXISTS ${tableNames.sessions}`);

	await Promise.all([
		sessionsTableDrop,
		apiKeysTableDrop
	]);
}


// Sets up and starts up the database
async function start(skipTableCreation = false) {
	if(!TESTING) console.log("Creating And Testing A Connection");

	// Test connection
	await singleQueryPromisify("SELECT 1 + 1 AS solution")
		.then(() => {
			if(!TESTING) console.log("Successfully Connection Confirmed");
		})
		.catch(err => {
			console.warn("Failed To Confirm Connection:");
			console.error(err);
		});

	if(!skipTableCreation) {
		// Create tables if they do not already exist
		if(!TESTING) console.log("Setting Up Tables");
		await createTables()
			.then(() => {
				if(!TESTING) console.log("Table Existence Confirmed");
			})
			.catch(err => {
				console.warn("Failed To Create Tables:");
				console.error(err);
			});
	}
}

// Permanently closes the database connection until the server is restarted
async function end() {
	// Note: Any other cleanup tasks may go here
	await sequelize.close();
}



// TODO: Rework return values
async function singleQueryPromisify(query, args = []) {
	const [res, metadata] = await sequelize.query(query, {
		replacements: args.flat()
	});
	return [res, metadata];
}

async function transactionPromisify() {
	return await sequelize.transaction();
}

// TODO: Rework return values
async function transactionQuery(transaction, query, ...args) {
	// Don't forget to await transaction.commit()!
	try {
		const [res, metadata] = await sequelize.query(query, {
			replacements: args.flat(),
			transaction: transaction
		});

		console.log(query)
		console.log(res)

		return [res, metadata];
	} catch(err) {
		console.log(`[ROLLBACK] Failed Query: ${query}`);
		console.error(err);
		await transaction.rollback();
		throw err;
	}
}


export { start, end };
export const _dropTables = dropTables;
export { singleQueryPromisify };
export { transactionPromisify };
export { transactionQuery };

// Import in other files as `db` for brevity
const db = sequelize;  // Constant declared to hint IDEs to automatically import `db` from this file
export default db;
