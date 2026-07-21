"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HttpExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let HttpExceptionFilter = HttpExceptionFilter_1 = class HttpExceptionFilter {
    logger = new common_1.Logger(HttpExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let code = 'INTERNAL_SERVER_ERROR';
        let message = 'Something went wrong. Please try again later';
        let field = undefined;
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const resBody = exception.getResponse();
            if (typeof resBody === 'string') {
                message = resBody;
            }
            else if (resBody && typeof resBody === 'object') {
                if (Array.isArray(resBody.message)) {
                    code = 'VALIDATION_ERROR';
                    message = resBody.message[0];
                    const words = message.split(' ');
                    if (words.length > 0) {
                        field = words[0].replace(/['"]/g, '');
                    }
                }
                else {
                    message = resBody.message || exception.message;
                }
            }
            if (status === common_1.HttpStatus.BAD_REQUEST && code !== 'VALIDATION_ERROR') {
                code = 'BAD_REQUEST';
            }
            else if (status === common_1.HttpStatus.UNAUTHORIZED) {
                code = 'UNAUTHORIZED';
            }
            else if (status === common_1.HttpStatus.FORBIDDEN) {
                code = 'FORBIDDEN';
            }
            else if (status === common_1.HttpStatus.NOT_FOUND) {
                code = 'NOT_FOUND';
            }
            else if (status === common_1.HttpStatus.CONFLICT) {
                code = 'CONFLICT';
            }
            else if (status === common_1.HttpStatus.UNPROCESSABLE_ENTITY) {
                code = 'UNPROCESSABLE_ENTITY';
            }
        }
        else {
            this.logger.error(`Unhandled exception on ${request?.method} ${request?.url}: ${exception?.message || exception}`, exception?.stack);
        }
        response.status(status).json({
            success: false,
            error: {
                code,
                message,
                ...(field ? { field } : {}),
            },
        });
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = HttpExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map