import { ERROR_MSG } from "../constants/errorMessage.constant.js";
import { BadRequestError } from "../error/BadRequest.error.js";
import { CommonUtils } from "../utils/common.util.js";

export class PostDTO {
    constructor(post) {
        if (!('content' in post) &&
            CommonUtils.checkNullOrUndefined(post.content)) {
            throw BadRequestError(ERROR_MSG.INVALID_REQ)
        }

        this.id = CommonUtils.checkNullOrUndefined(post.id) ? post.id : null;
        this.content = post.content;
        this.authorId = CommonUtils.checkNullOrUndefined(post.authorId) ? post.authorId : null;
    }
}