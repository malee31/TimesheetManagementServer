import * as dotenv from "dotenv";
import { apiKeyLookup } from "../../database/database-interface.js";
// Load in admin password from env.
// TODO: Consider not hard-coding the admin password in env
dotenv.config();
const ADMIN_KEY = process.env.ADMIN_KEY;

const authErrors = {
	not_authed: {
		ok: false,
		error: "not_authed"
	},
	invalid_auth_format: {
		ok: false,
		error: "invalid_auth_format"
	},
	invalid_admin_auth: {
		ok: false,
		error: "invalid_admin_auth"
	},
	user_not_found: {
		ok: false,
		error: "user_not_found"
	},
	auth_revoked_by_user: {
		ok: false,
		error: "auth_revoked_by_user"
	}
};

function authExistsMiddleware(req, res, next) {
	const auth = req.header("Authorization");
	if(!auth) {
		return res.status(401).send(authErrors.not_authed);
	}

	if(!auth.startsWith("Bearer ")) {
		return res.status(400).send(authErrors.invalid_auth_format);
	}

	req.locals = {};  // Modify the req instead of using res.locals for semantics
	req.locals.apiKey = auth.substring(auth.indexOf(" ") + 1);
	next();
}

// Handles all the 401 errors for users
async function userAuthMiddleware(req, res, next) {
	if(!req.locals.apiKey) throw new Error("Middleware authExistsMiddleware() should run before this");

	const apiKey = req.locals.apiKey;
	if(!apiKey.startsWith("U-")) {
		// TODO: Consider unique error for incorrect format
		return res.status(401).send(authErrors.invalid_auth_format);
	}

	// Look up the api key to confirm it exists
	const linkedPasswordRows = await apiKeyLookup(apiKey);
	if(!linkedPasswordRows.length) {
		return res.status(404).send(authErrors.user_not_found);
	}

	if(!linkedPasswordRows.length > 1) {
		console.warn("Warning: There are multiple rows with the same API key!");
	}

	const linkedPassword = linkedPasswordRows[0];
	if(linkedPassword["revoked"]) {
		return res.status(401).send(authErrors.auth_revoked_by_user)
	}

	// Extract api key from the results
	req.locals.password = linkedPassword["password"];

	next();
}

function adminAuthMiddleware(req, res, next) {
	if(!req.locals.apiKey) throw new Error("Middleware authExistsMiddleware() should run before this");

	const apiKey = req.locals.apiKey;
	if(!apiKey.startsWith("A-")) {
		// TODO: Consider unique error for incorrect format
		return res.status(401).send(authErrors.invalid_auth_format);
	}

	// Prevent invalid admin keys from using the routes
	if(apiKey !== ADMIN_KEY) {
		return res.status(401).send(authErrors.invalid_admin_auth);
	}

	next();
}

const authMiddleware = {
	user: [authExistsMiddleware, userAuthMiddleware],
	admin: [authExistsMiddleware, adminAuthMiddleware]
};

export default authMiddleware;