
import { API_CONFIG } from "../configs/api.config.js"
import { CommonUtils } from "../utils/common.util.js"

async function executeHttpRequest(url, method, payload = {}, optional = API_CONFIG.DEFAULT_API_OPTION) {
    const requestOptions = {
        ...optional,
        method // *GET, POST, PUT, DELETE, etc.
    }

    if (!CommonUtils.checkNullOrUndefined(method) &&
        method !== "GET" &&
        !CommonUtils.checkNullOrUndefined(payload)) {
        requestOptions.body = JSON.stringify(payload)
    }

    const response = await fetch(url, requestOptions);

    // response.json trả về 1 object Promises
    // => ai gọi hàm này thì tiếp tục đợi tiếp để js xử lý lấy return result.
    return response.json();
}

export const ApiUtils = {
    executeHttpRequest
}
