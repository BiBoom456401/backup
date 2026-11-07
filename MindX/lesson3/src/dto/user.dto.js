import { ERROR_MSG } from "../constants/errorMessage.constant.js";
import { BadRequestError } from "../error/BadRequest.error.js";
import { CommonUtils } from "../utils/common.util.js";

export class UserDTO {
    constructor(user) {
        if (!('userName' in user) &&
            CommonUtils.checkNullOrUndefined(user.userName)) {
            throw BadRequestError(ERROR_MSG.INVALID_REQ)
        }

        this.id = CommonUtils.checkNullOrUndefined(user.id) ? user.id : null;
        this.userName = user.userName;
    }
}
