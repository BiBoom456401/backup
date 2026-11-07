import { DB_CONFIG } from "../configs/db.config.js"
import { ApiUtils } from "../utils/api.util.js"
import { API_METHOD } from "../utils/api.enum.js"
import { v4 } from "uuid";
import { CommonUtils } from "../utils/common.util.js";
import { BadRequestError } from "../error/BadRequest.error.js";
import { CommentService as commentService } from "./comment.service.js";
import { CommentDTO } from "../dto/comment.dto.js";

const postUrl = DB_CONFIG.baseUrl + DB_CONFIG.resources.post.contextPath

async function getById(id) {
    return await ApiUtils.executeHttpRequest(postUrl + "/" + id, API_METHOD.GET)
}

async function addPostComment(comment, postId) {
    if (!(comment instanceof CommentDTO)) {
        throw new Error("Invalid comment object");
    }

    const post = await getById(postId)

    if (CommonUtils.checkNullOrUndefined(post)) {
        throw new BadRequestError(ERROR_MSG.POST_NOT_FOUND + postId);
    }

    // Check thêm field nào require và format gì thêm vào nếu nghiệp vụ yêu cầu
    // không thì thôi insert luôn
    comment.postId = post.id;

    return await commentService.create(comment);
}

function postIdGenerator() {
    return "US" + v4()
}

export const PostService = {
    getById,
    addPostComment
}
