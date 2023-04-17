import { Router } from "express";
import authMiddleware from "../../middleware/auth-errors.js";
import { apiKeyExchange, apiKeyRegenerate } from "../../../database-interface.js";
import { ensureBodyKey } from "../../middleware/body-errors.js";

const authRouter = Router();

const authErrors = {
	already_revoked: {
		ok: false,
		error: "already_revoked"
	},
	no_password_provided: {
		ok: false,
		error: "no_password_provided"
	}
};

authRouter.post("/exchange", ensureBodyKey("password", authErrors.no_password_provided), async (req, res) => {
	// Exchange a password for an api key
	const apiKey = await apiKeyExchange(req.body["password"]);
	return res.status(200).send({
		ok: true,
		api_key: apiKey
	});
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