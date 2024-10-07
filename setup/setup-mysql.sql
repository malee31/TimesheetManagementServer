-- Sample commands for creating the database used by the project
-- IMPORTANT: Before copy-pasting, make the following substitutions manually or with Find-and-Replace (without the quotes):
    -- INSERT_DATABASE_NAME_HERE - Replace with 'timesheet_server' or a custom name for the MySQL database
    -- INSERT_API_USER_NAME_HERE - Replace with 'timesheet-api' or a custom MySQL username for the project to use
    -- INSERT_API_USER_PASSWORD_HERE - Replace with 'The-password-4-the-timesheet-api-user' or a custom password for the MySQL user


-- Run the following as a MySQL superuser like `mysql` or `root` to create the database
CREATE DATABASE `INSERT_DATABASE_NAME_HERE`;

-- Run the following to create the new MySQL user
CREATE USER 'INSERT_API_USER_NAME_HERE'@'localhost' IDENTIFIED BY 'INSERT_API_USER_PASSWORD_HERE';

-- Add permissions to:
    -- Create/Delete Tables
    -- Select from Tables
    -- Insert to Tables
    -- Update to Tables
    -- Delete from Tables
GRANT ALL PRIVILEGES ON `INSERT_DATABASE_NAME_HERE`.* TO 'INSERT_API_USER_NAME_HERE'@'localhost';
FLUSH PRIVILEGES;