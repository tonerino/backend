"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug = require("debug");
const httpStatus = require("http-status");
const user_1 = require("../../user");
const log = debug('frontend:base');
/**
 * オプション取得
 */
function getOptions(req, apiEndpoint) {
    let endpoint;
    let authClient;
    if (apiEndpoint === user_1.ApiEndpoint.cinerino) {
        endpoint = process.env.CINERINO_API_ENDPOINT;
        authClient = req.user.authClient;
    }
    else {
        endpoint = process.env.API_ENDPOINT;
        authClient = req.user.cinerinoAuthClient;
    }
    return {
        endpoint,
        auth: authClient,
        // APIはマルチプロジェクトなので、プロジェクトIDを指定
        project: {
            id: process.env.PROJECT_ID
        }
    };
}
exports.getOptions = getOptions;
/**
 * エラー
 */
function errorProsess(res, err) {
    log('errorProsess', err);
    if (err.code !== undefined) {
        res.status(err.code);
    }
    else {
        res.status(httpStatus.BAD_REQUEST);
    }
    res.json(err);
}
exports.errorProsess = errorProsess;
