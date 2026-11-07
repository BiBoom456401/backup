import { ERROR_MSG } from "../constants/errorMessage.constant.js";
import { CommentDTO } from "../dto/comment.dto.js";
import { UserDTO } from "../dto/user.dto.js";
import { BadRequestError } from "../error/BadRequest.error.js";
import { BaseError } from "../error/base.error.js";
import { UserService as userService } from "../service/user.service.js";
import { CommonUtils } from "../utils/common.util.js";

async function getAll(req, res) {
    try {
        res.json(await userService.getAllUsers());
    } catch (err) {
        console.error(`Error while get all user`, err.message);

        if (err instanceof BaseError) {
            res.status(err.statusCode)
        } else {
            res.status(500)
        }

        res.json({
            error: {
                msg: err.message
            }
        });
    }
}

async function register(req, res) {
    try {
        if (CommonUtils.checkNullOrUndefined(req.body)) {
            throw new BadRequestError(ERROR_MSG.INVALID_REQ)
        }

        const newUser = new UserDTO(req.body)

        res.json(await userService.registerUser(newUser));
    } catch (err) {
        console.error(`Error while register new user`, err.message);

        if (err instanceof BaseError) {
            res.status(err.statusCode)
        } else {
            res.status(500)
        }

        res.json({
            error: {
                msg: err.message
            }
        });
    }
}

async function commentOnPostByPostId(req, res) {
    try {
        const userId = req.params.userId;
        const postId = req.params.postId;

        if (CommonUtils.checkNullOrUndefined(req.body) ||
            CommonUtils.checkNullOrUndefined(userId) ||
            CommonUtils.checkNullOrUndefined(postId)
        ) {
            throw new BadRequestError(ERROR_MSG.INVALID_REQ)
        }

        const comment = new CommentDTO(req.body);

        res
            .json(await userService
                .commentOnPostByPostId(comment, userId, postId))
    } catch (err) {
        console.error(`Error while add comment on post`, err.message);

        if (err instanceof BaseError) {
            res.status(err.statusCode)
        } else {
            res.status(500)
        }

        res.json({
            error: {
                msg: err.message
            }
        });
    }
}

export const UserController = {
    getAll,
    register,
    commentOnPostByPostId
}