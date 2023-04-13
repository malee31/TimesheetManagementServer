import { Router } from "express";
import authMiddleware from "../../middleware/auth-errors.js";

const sessionRouter = Router();

sessionRouter.delete("/:session-id", authMiddleware.admin, (req, res) => {
	// Deletes an arbitrary session
	return res.sendStatus(501);
});

sessionRouter.get("/latest", authMiddleware.admin, (req, res) => {
	// Gets latest session
	// TODO: Consider removal or merge with ":session-id"
	return res.sendStatus(501);
});

sessionRouter.patch("/latest", authMiddleware.user, (req, res) => {
	// Changes latest session for logout
	// TODO: Reconsider implementation/endpoint
	return res.sendStatus(501);
});

export default sessionRouter;