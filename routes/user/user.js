import { Router } from "express";
import authMiddleware from "../middleware/auth-errors.js";
import authRouter from "./auth/auth.js";
import sessionRouter from "./session/session.js";
import { changePassword, createUser, deleteUser, getLatestSession, getUser, listSessions } from "../../database-interface.js";

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

userRouter.post("/", authMiddleware.admin, async (req, res) => {
	// Add user from req.body
	let newUser;
	try {
		newUser = await createUser(req.body);
	} catch(err) {
		if(err.code === "user_data_not_nonempty_strings") {
			return res.status(403).send(userErrors[err.code]);
		}
		if(err.code === "ER_DUP_ENTRY") {
			return res.status(409).send(userErrors.password_in_use)
		}
		console.warn("Unknown error while creating user:");
		console.error(err);
		return res.status(500).send("Unknown error while creating a user. Please let the server owner know for investigation");
	}

	return res.status(201).send(newUser);
});

userRouter.patch("/password", authMiddleware.user, async (req, res) => {
	const newPassword = req.body && typeof req.body["new_password"] === "string" ? req.body["new_password"].trim() : "";
	if(!newPassword) {
		return res.status(400).send(userErrors.no_new_password);
	}

	await changePassword(req.locals.password, newPassword);
	return res.status(200).send({
		ok: true,
		message: "Password Successfully Changed"
	});
});

userRouter.delete("/", authMiddleware.admin, async (req, res) => {
	// Delete the user completely given a password in the body
	if(!req.body || !req.body["password"]) {
		return res.status(400).send(userErrors.no_password_provided);
	}

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

userRouter.post("/sessions", authMiddleware.admin, (req, res) => {
	// Adds an arbitrary session
	// TODO: Consider rejects for currently active sessions
	return res.sendStatus(501);
});

// TODO: Consider a public "/:id" endpoint

userRouter.use("/auth", authRouter);
userRouter.use("/session", sessionRouter);

export default userRouter;