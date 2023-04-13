import { Router } from "express";

const initialRouter = Router();

initialRouter.get("*", (req, res) => {
	res.status(503).send("Server restarting... Try again in a minute");
});

export default initialRouter;