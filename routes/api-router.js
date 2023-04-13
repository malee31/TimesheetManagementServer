import { Router } from "express";
import usersRouter from "./users/users.js";
import userRouter from "./user/user.js";

const apiRouter = Router();

apiRouter.use("/users", usersRouter);
apiRouter.use("/user", userRouter);

export default apiRouter;