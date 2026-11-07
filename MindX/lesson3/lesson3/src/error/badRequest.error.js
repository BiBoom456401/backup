import { BaseError } from "./base.error.js";

export class BadRequestError extends BaseError {
    constructor(message) {
        super(message)
        this.statusCode = 400;
    }
}
