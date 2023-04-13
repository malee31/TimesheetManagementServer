import { Router } from "express";
import authMiddleware from "../../middleware/auth-errors.js";

const authRouter = Router();

authRouter.post("/exchange", (req, res) => {
	// Exchange a password for an api key
	return res.sendStatus(501);
});

authRouter.post("/revoke", authMiddleware.user, (req, res) => {
	// Regenerate an api key
	return res.sendStatus(501);
});

export default authRouter;