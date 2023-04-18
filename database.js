import * as dotenv from "dotenv";
// Configure SQL credentials from environment variables
dotenv.config();
import mysql from "mysql";
import schemas from "./table-schemas.js";

// Note: Before use, guarantee that the connection is active and the tables have been set up with start()
export const pool = mysql.createPool({
	host: process.env.MYSQL_HOST,
	user: process.env.MYSQL_USER,
	password: process.env.MYSQL_PASSWORD,
	database: process.env.MYSQL_DATABASE,
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
	const usersTableCreate = singleQueryPromisify(schemas.users);
	const sessionsTableCreate = singleQueryPromisify(schemas.sessions);
	const apiKeysTableCreate = singleQueryPromisify(schemas.apiKeys);

	return await Promise.all([
		usersTableCreate,
		sessionsTableCreate,
		apiKeysTableCreate
	]);
}

async function start() {
	console.log("Creating And Testing A Connection");
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
	console.log("Setting Up Tables");
	await createTables()
		.then(() => {
			console.log("Table Existence Confirmed");
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