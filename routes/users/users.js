import { Router } from "express";
import authMiddleware from "../middleware/auth-errors.js";
import { getAllUsers, getAllUsersWithStatus } from "../../database-interface.js";

const usersRouter = Router();

usersRouter.get("/", async (req, res) => {
	// List all user data
	const allUsers = await getAllUsers();
	return res.status(200).send({
		ok: true,
		users: allUsers
	});
});

usersRouter.get("/status", async (req, res) => {
	// List all user data with statuses
	// TODO: Join with sessions
	const allUsers = await getAllUsersWithStatus();
	return res.status(200).send({
		ok: true,
		users: allUsers
	});
});

usersRouter.get("/sessions", authMiddleware.admin, (req, res) => {
	// New plan: This endpoint just gets paginated list of sessions. Regardless of who they are from
	return res.sendStatus(501);
});

export default usersRouter;