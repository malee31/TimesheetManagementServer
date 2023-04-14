import { Router } from "express";
import authMiddleware from "../middleware/auth-errors.js";
import authRouter from "./auth/auth.js";
import sessionRouter from "./session/session.js";
import { createUser, getUser } from "../../database-interface.js";

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

userRouter.put("/", authMiddleware.user, (req, res) => {
	// Edit user info like password
	// TODO: Consider PATCH "/user/password" instead
	return res.sendStatus(501);
});

userRouter.delete("/", authMiddleware.admin, (req, res) => {
	// Delete the user completely given a password in the body
	return res.sendStatus(501);
});

userRouter.get("/sessions", authMiddleware.user, (req, res) => {
	// Return all sessions tied to the user
	return res.sendStatus(501);
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