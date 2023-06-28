// Configure SQL credentials from environment variables
import mysql from "mysql";
import schemas from "./table-schemas.js";
import { MYSQL_DATABASE, MYSQL_HOST, MYSQL_PASSWORD, MYSQL_USER, TESTING } from "../../config.js";

// Note: Before use, guarantee that the connection is active and the tables have been set up with start()
export const pool = mysql.createPool({
	host: MYSQL_HOST,
	user: MYSQL_USER,
	password: MYSQL_PASSWORD,
	database: MYSQL_DATABASE,
	connectionLimit: 10
});

function promisifyConnection() {
	return new Promise((resolve, reject) => {
		pool.getConnection((err, connection) => {
			if(err) {
				connection.release();
				reject(err);
			}

			resolve(connection);
		});
	});
}

async function singleQueryPromisify(query, ...args) {
	const connection = await promisifyConnection();

	return await new Promise((resolve, reject) => {
		const connectionError = err => {
			connection.release();
			reject(err);
		};

		connection.once("error", connectionError);

		connection.query(query, ...args, (err, res) => {
			connection.removeListener("error", connectionError);
			connection.release();
			if(err) return reject(err);
			resolve(res);
		});
	});
}

async function transactionPromisify() {
	const connection = await promisifyConnection();

	return new Promise((resolve, reject) => {
		const connectionError = err => {
			connection.release();
			return reject(err);
		};

		connection.once("error", connectionError);

		connection.beginTransaction(err => {
			if(err) {
				return connectionError(err);
			}

			const rollback = async () => {
				return new Promise(resolve => {
					connection.rollback(err => {
						connection.removeListener("error", connectionError);
						connection.release();
						if(err) {
							return reject(err);
						}
						resolve();
					});
				});
			};

			const commit = async () => {
				return new Promise((resolve, reject) => {
					connection.commit(async err => {
						connection.removeListener("error", connectionError);
						if(err) {
							await rollback();
							return reject(err);
						}
						connection.removeListener("error", connectionError);
						connection.release();
						resolve();
					});
				});
			};

			resolve({
				commit: commit,
				rollback: rollback,
				connection: connection
			});
		});
	});
}

function transactionQuery(transaction, query, ...args) {
	// Don't forget to await transaction.commit()!
	return new Promise((resolve, reject) => {
		transaction.connection.query(query, ...args, async (err, res) => {
			if(err) {
				await transaction.rollback();
				return reject(err);
			}
			resolve(res);
		});
	});
}

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

async function start() {
	if(!TESTING) {
		console.log("Creating And Testing A Connection");
	}
	// Test connection
	await singleQueryPromisify("SELECT 1 + 1 AS solution")
		.then(() => {
			console.log("Successfully Connection Confirmed");
		})
		.catch(err => {
			console.warn("Failed To Confirm Connection:");
			console.error(err);
		});

	// Create tables if they do not already exist
	if(!TESTING) {
		console.log("Setting Up Tables");
	}
	await createTables()
		.then(() => {
			if(!TESTING) {
				console.log("Table Existence Confirmed");
			}
		})
		.catch(err => {
			console.warn("Failed To Create Tables:");
			console.error(err);
		});
}

async function end() {
	// TODO: Add any other cleanup tasks
	await new Promise(resolve => pool.end(() => resolve()));
}

const database = {
	start: start,
	end: end,
	pool: pool,
	singleQueryPromisify: singleQueryPromisify,
	transactionPromisify: transactionPromisify,
	transactionQuery: transactionQuery
};

export default database;