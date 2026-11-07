import { DB_CONFIG } from "../configs/db.config.js"
import { v4 } from "uuid";
import { CommentDTO } from "../dto/comment.dto.js";
import { ApiUtils } from "../utils/api.util.js";
import { API_METHOD } from "../utils/api.enum.js";

const commentUrl = DB_CONFIG.baseUrl + DB_CONFIG.resources.comment.contextPath

async function create(comment) {
    if (!(comment instanceof CommentDTO)) {
        throw new Error("Invalid user object");
    }
    // Check thêm field nào require và format gì thêm vào nếu nghiệp vụ yêu cầu
    // không thì thôi insert luôn

    comment.id = commentIdGenerator()

    return await ApiUtils.executeHttpRequest(commentUrl, API_METHOD.POST, comment)
}

function commentIdGenerator() {
    return "CMT" + v4()
}

export const CommentService = {
    create
}
