import { ERROR_MSG } from "../constants/errorMessage.constant.js";
import { BadRequestError } from "../error/BadRequest.error.js";
import { CommonUtils } from "../utils/common.util.js";

export class CommentDTO {
    constructor(comment) {
        if (!('content' in comment) &&
            CommonUtils.checkNullOrUndefined(comment.content)) {
            throw BadRequestError(ERROR_MSG.INVALID_REQ)
        }

        this.id = CommonUtils.checkNullOrUndefined(comment.id) ? comment.id : null;
        this.content = comment.content;
        this.postId = CommonUtils.checkNullOrUndefined(comment.postId) ? comment.postId : null;
        this.authorId = CommonUtils.checkNullOrUndefined(comment.authorId) ? comment.authorId : null;
    }
}
