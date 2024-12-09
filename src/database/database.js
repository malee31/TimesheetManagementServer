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
import { DataTypes, Model, Sequelize } from "sequelize";
import tableNames from "./table-names.js";
import { MYSQL_DATABASE, MYSQL_HOST, MYSQL_PASSWORD, MYSQL_USER, PRODUCTION, TESTING } from "../../config.js";

// Note: Before use, guarantee that the connection is active and the tables have been set up by calling start()
//       Beware that calling start() is *NOT* mandatory by design and not guaranteed to be called before all other functions
let sequelize = PRODUCTION
	? (
		new Sequelize(MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD, {
			dialect: "mysql",
			host: MYSQL_HOST,
			connectionLimit: 10,
			queueLimit: 20,
			waitForConnections: true,
			logging: false
		})
	) : (
		new Sequelize({
			dialect: "sqlite",
			storage: "dev-database.sqlite",
			logging: false
		})
	);

export class Session extends Model {}

export class User extends Model {}

export class ApiKey extends Model {}

Session.init({
	session_id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	password: {
		type: DataTypes.STRING(300),
		allowNull: false
	},
	startTime: {
		type: DataTypes.BIGINT,
		allowNull: false
	},
	endTime: {
		type: DataTypes.BIGINT
	},
}, {
	sequelize: sequelize,
	tableName: tableNames.sessions,
	timestamps: false
});

ApiKey.init({
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	password: {
		type: DataTypes.STRING(300),
		allowNull: false
	},
	api_key: {
		type: DataTypes.STRING(300),
		unique: true,
		allowNull: false
	},
	revoked: {
		type: DataTypes.BOOLEAN,
		allowNull: false,
		defaultValue: false
	},
}, {
	sequelize: sequelize,
	tableName: tableNames.api_keys,
	timestamps: false
});

User.init({
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	first_name: {
		type: DataTypes.TEXT,
		allowNull: false
	},
	last_name: {
		type: DataTypes.TEXT,
		allowNull: false
	},
	password: {
		type: DataTypes.STRING(300),
		allowNull: false,
		unique: true
	},
	session: {
		type: DataTypes.INTEGER,
		references: {
			model: Session,
			key: "session_id",
		},
		defaultValue: null,
		onDelete: "CASCADE"
	},
}, {
	sequelize: sequelize,
	tableName: tableNames.users,
	timestamps: false
});

export const SessionAssociation = User.hasMany(Session, {
	as: "session_data",
	foreignKey: "session_id",
	sourceKey: "session",
	constraints: false
});

// Generates tables if they do not exist
// WARNING: Will not modify tables with an updated schema if they already exist
async function createTables() {
	await sequelize.sync({
		alter: false,  // Change to true if models have changed
		logging: false  // Change to `console.log` if debugging or making alterations in development
	});
}

// Purges all tables and data
// Restarting the server should regenerate new tables using createTables()
async function dropTables(logging = true) {
	// All logging turned on for this extremely destructive action
	await sequelize.drop({
		cascade: true,
		benchmark: true,
		logging: logging ? console.info : false
	});
}


// Sets up and starts up the database
async function start(skipTableCreation = false) {
	if(!TESTING) console.log("===== Testing SQL Connection =====");

	// Test connection
	await db.query("SELECT 1 + 1 AS solution")
		.then(() => {
			if(!TESTING) console.log("===== SQL Connection Confirmed =====");
		})
		.catch(err => {
			console.warn("!!!!! Failed To Confirm Connection (Reason below) !!!!!");
			console.error(err);
		});

	if(!skipTableCreation) {
		// Create tables if they do not already exist
		if(!TESTING) console.log("===== Synchronizing Table Structures =====");
		await createTables()
			.then(() => {
				if(!TESTING) console.log("===== Confirmed Tables Exist =====");
			})
			.catch(err => {
				console.warn("!!!!! Failed To Create Tables (Reason below) !!!!!");
				console.error(err);
			});
	}
}

// Permanently closes the database connection until the server is restarted
async function end() {
	// Note: Any other cleanup tasks may go here
	await sequelize.close();
}

export { start, end };
export const _dropTables = dropTables;

// Import in other files as `db` for brevity
const db = sequelize;  // Constant declared to hint IDEs to automatically import `db` from this file
export default db;
