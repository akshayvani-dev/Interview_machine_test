import { Router } from "express";
import { createUser, updateUser } from "../controllers/user.controller.js";
export const userRouter = Router();
userRouter.post("/api/v1/users", createUser);
userRouter.patch("/api/v1/users/:id", updateUser);
//# sourceMappingURL=user.routes.js.map