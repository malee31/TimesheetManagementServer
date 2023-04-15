import { Router } from "express";
import authMiddleware from "../../middleware/auth-errors.js";
import { createSession, deleteSession, getLatestSession, patchSession } from "../../../database-interface.js";

const sessionRouter = Router();

const sessionErrors = {
	no_session_found: {
		ok: false,
		error: "no_session_found"
	},
	no_session_method: {
		ok: false,
		error: "no_session_method"
	},
	invalid_session_method: {
		ok: false,
		error: "invalid_session_method"
	},
	invalid_session_id: {
		ok: false,
		error: "invalid_session_id"
	}
};

sessionRouter.delete("/:sessionid", authMiddleware.admin, async (req, res) => {
	// Deletes an arbitrary session
	const sessionId = Number(req.params["sessionid"]);

	if(isNaN(sessionId)) {
		return res.status(400).send(sessionErrors.invalid_session_id);
	}

	try {
		await deleteSession(sessionId);
	} catch(err) {
		if(err.code === "not_found") {
			return res.status(200).send({
				ok: true,
				warning: "nothing_to_delete"
			});
		}
		console.warn(`Unknown error while deleting session ${sessionId}:`);
		console.error(err);
	}
	return res.status(200).send({
		ok: true,
		old_session_id: sessionId
	});
});

sessionRouter.get("/latest", authMiddleware.user, async (req, res) => {
	// Gets latest session
	// TODO: Consider removal or merge with ":session-id"
	const latestSession = await getLatestSession(req.locals.password);
	if(!latestSession) {
		return res.status(404).send(sessionErrors.no_session_found);
	}
	return res.status(200).send({
		ok: true,
		session: latestSession
	});
});

sessionRouter.patch("/latest", authMiddleware.user, async (req, res) => {
	// Changes latest session for logout
	// TODO: Reconsider implementation/endpoint
	if(!req.body || !req.body["method"]) {
		return res.status(400).send(sessionErrors.no_session_method)
	}

	const method = req.body["method"];
	if(method !== "sign_in" && method !== "sign_out") {
		return res.status(400).send(sessionErrors.invalid_session_method);
	}

	const latestSession = await getLatestSession(req.locals.password);

	if(method === "sign_in") {
		if(latestSession && !latestSession.endTime) {
			return res.status(200).send({
				ok: true,
				warning: "already_signed_in"
			});
		}

		const newSession = await createSession(req.locals.password, Date.now());
		return res.status(200).send({
			ok: true,
			session: newSession
		});
	}
	// Method "sign_out"
	if(!latestSession || latestSession.endTime) {
		return res.status(200).send({
			ok: true,
			warning: "already_signed_out"
		});
	}

	const patchedSession = {
		...latestSession,
		endTime: Date.now()
	};
	await patchSession(patchedSession);

	return res.status(200).send({
		ok: true,
		session: patchedSession
	});
});

export default sessionRouter;