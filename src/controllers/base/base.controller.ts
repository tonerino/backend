/**
 * base
 */
import * as chevre from '@toei-jp/chevre-api-nodejs-client';
import * as cinerino from '@toei-jp/cinerino-api-nodejs-client';
import * as debug from 'debug';
import { Request, Response } from 'express';
import * as httpStatus from 'http-status';
import { ApiEndpoint } from '../../user';

const log = debug('frontend:base');

/**
 * オプション取得
 */
export function getOptions(req: Request, apiEndpoint?: ApiEndpoint) {
    let endpoint: string;
    let authClient: chevre.auth.OAuth2 | cinerino.auth.OAuth2;
    if (apiEndpoint === ApiEndpoint.cinerino) {
        endpoint = (<string>process.env.CINERINO_API_ENDPOINT);
        authClient = req.user.authClient;
    } else {
        endpoint = (<string>process.env.API_ENDPOINT);
        authClient = req.user.cinerinoAuthClient;
    }

    return {
        endpoint,
        auth: authClient
    };
}

/**
 * エラー
 */
export function errorProsess(res: Response, err: any) {
    log('errorProsess', err);
    if (err.code !== undefined) {
        res.status(err.code);
    } else {
        res.status(httpStatus.BAD_REQUEST);
    }
    res.json(err);
}
