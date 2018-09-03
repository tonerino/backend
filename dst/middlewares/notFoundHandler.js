"use strict";
/**
 * 404ハンドラーミドルウェア
 */
Object.defineProperty(exports, "__esModule", { value: true });
const ErrorController = require("../controllers/error");
exports.default = (req, res) => {
    ErrorController.notFound(req, res);
};
