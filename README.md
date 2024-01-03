# Timesheet Management Server
A proper, fully built API for managing users and tracking work session clock in times.  
Intended to be the successor version of the old API which depended on client-side validation and is unscalable.

# Installation
Before installing, make sure you have all the information required to connect to a running MySQL server:
* `MYSQL_HOST`: MySQL Server IP or URL
* `MYSQL_USER`: MySQL Server user
* `MYSQL_PASSWORD`: MySQL Server user's password
* `MYSQL_DATABASE`: A MySQL Database to store data in. It must exist and the `MYSQL_USER` must have full read/write and table create/destroy permissions on it

Then follow these steps:
1. Clone this repository
2. Copy `template.env` and name the copy `.env`
3. Open `.env` and place your MySQL connection information in the lines they correspond to
4. Choose a port in `.env` or leave it as the default `3000`
5. Install dependencies with `npm install` or (`npm install --save-dev` to include test libraries)
6. (Optional) Run `npm test` to run tests on the database (it will clean up after itself)
7. Run one of the following commands:
	* `npm start` to start the server normally
	* `npm run develop` to start the server in development mode (automatically restarts after the code changes)

## Documentation
API documentation can be found in `API.md` until a proper documentation site is written out.

## Testing
Testing is completed using Jest and most test files are stored besides the source files as `*.test.js` files.  
Run the unit tests by running `npm test`.

## Writing Tests
Write any `*.test.js` unit test files in the same folder as the corresponding `*.js` file.  
Place end-to-end tests in `src/end-to-end-tests` with a file name that describes the frontend functionality it is attempting to test.

### False Assumptions
Tests run in parallel with each other and have a chance to affect each other as a result.  
To minimize the chances of that happening, follow the guidelines in this section.

For tests that interact with the database, there are some assumptions you should **NOT** make:
* It is **NOT** safe to wipe any tables clean
	* All tests **WILL** assume that the tables exist
* It is **NOT** safe to depend on number of rows staying constant
	* When checking for effects, do **NOT** use too broad a check like table row counts and be specific. Check the fewest rows the test needs to pass or fail.
* A test will **NOT** hold the only connection to the database.
	* Other tests **WILL** run and write to the tables at the same time
* The number of rows will **NOT** stay constant
	* Other tests **WILL** add rows to the table using either the functions they are testing or `testUtils.js`

For dependable tests, create unique users to use for each test you perform.  
Convenience methods are provided by `testUtils.js` to quickly create a random user and provide your test with all the details it needs.  
**WARNING:** Accidentally using the same data across multiple tests may result in tests randomly failing when run in a different order that are hard to debug.  
