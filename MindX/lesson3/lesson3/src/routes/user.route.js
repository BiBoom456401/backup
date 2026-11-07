import express from 'express';
import { UserController } from '../controllers/user.controller.js';

const UserRouter = express.Router();

UserRouter.get("/", UserController.getAll)

UserRouter.post("/register", UserController.register)

UserRouter.post("/:userId/post/:postId/comment", UserController.commentOnPostByPostId)

export { UserRouter };
