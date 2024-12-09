// These routes are GET routes that retrieve aggregated information about all users at once, like their current state
import { Router } from "express";
import authMiddleware from "../middleware/auth-errors.js";
import { getAllUsers, getAllUsersWithStatus, getSessions } from "../../database/database-interface.js";

const usersRouter = Router();

const usersErrors = {
	invalid_page_number: {
		ok: false,
		error: "invalid_page_number"
	},
	invalid_count: {
		ok: false,
		error: "invalid_count"
	},
	no_page_provided: {
		ok: false,
		error: "no_page_provided"
	},
	no_count_provided: {
		ok: false,
		error: "no_count_provided"
	}
};

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
	const allUsers = await getAllUsersWithStatus();
	return res.status(200).send({
		ok: true,
		users: allUsers
	});
});

usersRouter.get("/sessions", [authMiddleware.admin], async (req, res) => {
	// New plan: This endpoint just gets paginated list of sessions. Regardless of who they are from
	// Sorted by session_id in ascending order (May change in the future)
	if(!("count" in req.query)) {
		return res.status(400).send(usersErrors.no_count_provided);
	}

	if(!("page" in req.query)) {
		return res.status(400).send(usersErrors.no_page_provided);
	}

	const count = parseInt(req.query["count"]);
	const page = parseInt(req.query["page"]);

	if(isNaN(count) || count <= 0) {
		return res.status(400).send(usersErrors.invalid_count);
	}

	if(isNaN(page) || page <= 0) {
		return res.status(400).send(usersErrors.invalid_page_number);
	}

	const offset = (page - 1) * count;
	const sessionResults = await getSessions(count, offset);

	if(sessionResults === null) {
		return res.status(200).send({
			ok: true,
			warning: "no_results",
			sessions: []
		});
	}

	// count and page will be used
	return res.status(200).send({
		ok: true,
		sessions: sessionResults
	});
});

export default usersRouter;