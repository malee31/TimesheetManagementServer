import { Router } from "express";
import authMiddleware from "../../middleware/auth-errors.js";
import { apiKeyRegenerate } from "../../../database-interface.js";

const authRouter = Router();

const authErrors = {
	already_revoked: {
		ok: false,
		error: "already_revoked"
	}
};

authRouter.post("/exchange", (req, res) => {
	// Exchange a password for an api key
	return res.sendStatus(501);
});

authRouter.post("/revoke", authMiddleware.user, async (req, res) => {
	const oldApiKey = req.locals.apiKey;
	let newApiKey;
	try {
		newApiKey = await apiKeyRegenerate(oldApiKey);
	} catch(err) {
		if(err.code === "already_revoked") {
			return res.status(409).send(authErrors.already_revoked);
		}
		console.warn("Unexpected revoke error");
		console.error(err);
		return res.status(500).send("Unknown error while regenerating an api key. Let the server owner know. Old logins will still work");
	}

	return res.sendStatus(200).send({
		ok: true,
		api_key: newApiKey
	});
});

export default authRouter;