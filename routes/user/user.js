import { Router } from "express";
import authMiddleware from "../middleware/auth-errors.js";
import authRouter from "./auth/auth.js";
import sessionRouter from "./session/session.js";
import { changePassword, createSession, createUser, deleteUser, getLatestSession, getUser, listSessions } from "../../database-interface.js";
import { ensureBodyKey, ensureBodyKeys, noBodyErrors } from "../middleware/body-errors.js";

const userRouter = Router();

const userErrors = {
	user_data_not_nonempty_strings: {
		ok: false,
		error: "user_data_not_nonempty_strings"
	},
	user_not_found: {
		ok: false,
		error: "user_not_found"
	},
	password_in_use: {
		ok: false,
		error: "password_in_use"
	},
	no_patch_method: {
		ok: false,
		error: "no_patch_method"
	},
	method_not_exist: {
		ok: false,
		error: "method_not_exist"
	},
	no_new_password: {
		ok: false,
		error: "no_new_password"
	},
	no_password_provided: {
		ok: false,
		error: "no_password_provided"
	},
	invalid_start_time: {
		ok: false,
		error: "invalid_start_time"
	},
	invalid_end_time: {
		ok: false,
		error: "invalid_end_time"
	},
	unknown_add_user_error: {
		ok: false,
		error: "unknown_add_user_error",
		message: "Unknown error while creating a user. Please let the server owner know for further investigation"
	}
};

userRouter.get("/", authMiddleware.user, async (req, res) => {
	// Return the user object
	const user = await getUser(req.locals.password);
	if(!user) {
		return res.status(404).send(userErrors.user_not_found);
	}

	return res.status(200).send({
		ok: true,
		...user
	});
});

userRouter.post("/", [authMiddleware.admin, noBodyErrors], async (req, res) => {
	// Add user from req.body
	try {
		const newUser = await createUser(req.body);

		return res.status(201).send(newUser);
	} catch(err) {
		if(err.code === "user_data_not_nonempty_strings") {
			return res.status(403).send(userErrors[err.code]);
		}
		if(err.code === "ER_DUP_ENTRY") {
			return res.status(409).send(userErrors.password_in_use)
		}
		console.warn("Unknown error while creating user:");
		console.error(err);
		return res.status(500).send({
			...userErrors.unknown_add_user_error,
			code: err.code
		});
	}
});

userRouter.patch("/password", [authMiddleware.user, ensureBodyKey("new_password", userErrors.no_new_password)], async (req, res) => {
	// TODO: Type check new_password and handle errors
	await changePassword(req.locals.password, req.body["new_password"]);
	return res.status(200).send({
		ok: true,
		message: "Password Successfully Changed"
	});
});

userRouter.delete("/", [authMiddleware.admin, ensureBodyKey("password", userErrors.no_password_provided)], async (req, res) => {
	// Delete the user completely given a password in the body
	try {
		await deleteUser(req.body["password"]);
	} catch(err) {
		if(err.code === "already_deleted") {
			return res.status(202).send({
				ok: true,
				warning: "already_deleted"
			});
		}

		console.warn("Unknown error while deleting a user:");
		console.error(err);
		return res.status(500).send("Unknown error encountered while deleting user. Let the server owner know for more information");
	}

	return res.status(200).send({
		ok: true,
		message: "Successfully Deleted User"
	});
});

userRouter.get("/status", authMiddleware.user, async (req, res) => {
	// Return status of the user
	// TODO: Switch to using a JOIN
	const user = await getUser(req.locals.password);
	const latestSession = await getLatestSession(req.locals.password);
	return res.status(200).send({
		ok: true,
		user: {
			...user,
			session: latestSession
		}
	});
});

userRouter.get("/sessions", authMiddleware.user, async (req, res) => {
	// Return all sessions tied to the user
	const userSessions = await listSessions(req.locals.password);
	return res.status(200).send({
		ok: true,
		sessions: userSessions
	});
});

userRouter.post("/sessions", [authMiddleware.admin, ensureBodyKeys(["password", "startTime", "endTime"])], async (req, res) => {
	// Adds an arbitrary session
	// TODO: Consider rejects for currently active sessions
	const password = req.body["password"];
	const startTime = parseInt(req.body["startTime"]);
	const endTimeStr = req.body["endTime"];
	const endTime = endTimeStr === null ? null : parseInt(endTimeStr);

	if(!password) {
		return res.status(400).send(userErrors.no_password_provided);
	}

	if(isNaN(startTime) || startTime < 0) {
		return res.status(400).send(userErrors.invalid_start_time);
	}

	// if(endTime !== null && (isNaN(endTime) || endTime < 0)) {
	if(endTime === null || isNaN(endTime) || endTime < startTime) {
		return res.status(400).send(userErrors.invalid_end_time);
	}

	const newSession = await createSession(password, startTime, endTime, true);

	return res.status(200).send({
		ok: true,
		session: newSession
	});
});

// TODO: Consider a public "/:id" endpoint

userRouter.use("/auth", authRouter);
userRouter.use("/session", sessionRouter);

export default userRouter;