import { Router } from "express";

const initialRouter = Router();

initialRouter.use((req, res) => {
	res.status(503).send({
		ok: false,
		error: "server_restarting",
		message: "Server restarting... Try again in a bit"
	});
});

export default initialRouter;