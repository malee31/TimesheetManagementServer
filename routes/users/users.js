import { Router } from "express";
import authMiddleware from "../middleware/auth-errors.js";

const usersRouter = Router();

usersRouter.get("/", (req, res) => {
	// List all user data
	return res.sendStatus(501);
});

usersRouter.get("/status", (req, res) => {
	// List all user data with statuses
	return res.sendStatus(501);
});

usersRouter.get("/sessions", authMiddleware.admin, (req, res) => {
	// List all user sessions grouped by user
	return res.sendStatus(501);
});

export default usersRouter;