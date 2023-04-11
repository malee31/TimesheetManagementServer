import mysql from "mysql";

// Note: Before use, guarantee that the connection is active and the tables have been set up with start()
export const connection = mysql.createConnection({
	host: process.env.MYSQL_HOST,
	user: process.env.MYSQL_USER,
	password: process.env.MYSQL_PASSWORD,
	database: process.env.MYSQL_DATABASE
});

async function start() {
	await connection.connect();
	// Test connection
	await new Promise((_, reject) => {
		connection.query("SELECT 1 + 1 AS solution", err => {
			if(!err) return;
			reject(err);
		});
	});

	// TODO: Create tables if they do not already exist
}

async function end() {
	// TODO: Add any other cleanup tasks
	await connection.end();
}

const database = {
	start: start,
	end: end,
	connection: connection
};

export default database;