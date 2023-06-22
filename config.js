/**
 * @file Loads in all configurations from .env files and re-exports them in case mocking is needed
 * Completely mock out the config for testing
 */

import * as dotenv from "dotenv";

dotenv.config();

export const TESTING = false;
// TODO: Consider not hard-coding the admin password in env
export const ADMIN_KEY = process.env.ADMIN_KEY;
export const API_PORT = process.env.API_PORT ?? 3000;
export const MYSQL_HOST = process.env.MYSQL_HOST;
export const MYSQL_USER = process.env.MYSQL_USER;
export const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD;
export const MYSQL_DATABASE = process.env.MYSQL_DATABASE;