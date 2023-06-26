# Timesheet Management Server
A proper, fully built API for managing users and work session clock in times.  
Intended to be the successor version of the old API that depends on client-side validation and is unscalable.  

An experiment in excellent API design, test-driven development, and documentation.

## Documentation
API documentation can be found in `API.md` until a proper documentation site is written out.

## Testing
Testing is completed using Jest and most test files are stored besides the source files as `*.test.js` files.  
Run the unit tests by using `npm test`.

## Writing Tests
Write any `*.test.js` unit test files next to where the corresponding `*.js` file is located within the project files.  
For end-to-end tests, place them in the root of the project under their corresponding folders.  

A note about tests that interact with the database: Do not assume that the test holds the only connection to the database at any given time.  
As Jest runs all the tests in parallel, there's no guarantee that there will be one fewer rows in a table after deleting a row the next time you check as an insert may have occurred in the meantime.  
For dependable tests, create and use a unique user for each test you perform.  
Convenience methods will be provided to instantly create a random user and provide your test with all the details it needs.  
When checking for the effects, do not use broad checks like checking the number of rows in the table and instead be more specific and check up on only the row that the test is concerned with.  
Violating these guidelines may result in random test failures occurring randomly when run in a different order that are hard to debug.  
**YOU HAVE BEEN WARNED.**