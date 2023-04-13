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

function queryPromisify(query, ...args) {
	return new Promise((resolve, reject) => {
		pool.getConnection((err, connection) => {
			if(err) {
				connection.release();
				reject(err);
			}

			connection.on("error", function(err) {
				connection.release();
				reject(err);
			});

			connection.query(query, ...args, (err, res) => {
				connection.release();
				if(err) return reject(err);
				resolve(res);
			});
		});
	});
}

async function createTables() {
	const usersTableCreate = queryPromisify(schemas.users);
	const sessionsTableCreate = queryPromisify(schemas.sessions);
	const apiKeysTableCreate = queryPromisify(schemas.apiKeys);

	return await Promise.all([
		usersTableCreate,
		sessionsTableCreate,
		apiKeysTableCreate
	]);
}

async function start() {
	console.log("Creating And Testing A Connection");
	// Test connection
	await queryPromisify("SELECT 1 + 1 AS solution")
		.then(() => {
			console.log("Successfully Connection Confirmed");
		})
		.catch(err => {
			console.warn("Failed To Confirm Connection:");
			console.error(err);
		});

	// Create tables if they do not already exist
	console.log("Setting up tables");
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
	queryPromisify: queryPromisify
};

export default database;