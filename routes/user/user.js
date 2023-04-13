import { Router } from "express";
import authMiddleware from "../middleware/auth-errors.js";
import authRouter from "./auth/auth.js";
import sessionRouter from "./session/session.js";

const userRouter = Router();

userRouter.get("/", authMiddleware.user, (req, res) => {
	// Return the user object
	return res.sendStatus(501);
});

userRouter.post("/", authMiddleware.admin, (req, res) => {
	// Add user from req.body
	return res.sendStatus(501);
});

userRouter.put("/", authMiddleware.user, (req, res) => {
	// Edit user info like password
	// TODO: Consider PATCH "/user/password" instead
	return res.sendStatus(501);
});

userRouter.delete("/", authMiddleware.admin, (req, res) => {
	// Delete the user completely
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