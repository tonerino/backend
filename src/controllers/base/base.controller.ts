/**
 * base
 */

import * as debug from 'debug';
import { Request, Response } from 'express';
import * as httpStatus from 'http-status';
import { ApiEndpoint, AuthModel, IAuthSession } from '../../models/auth/auth.model';

const log = debug('frontend:base');

/**
 * オプション取得
 */
export function getOptions(req: Request, apiEndpoint?: ApiEndpoint) {
    let endpoint: string;
    if (apiEndpoint === ApiEndpoint.cinerino) {
        endpoint = (<string>process.env.CINERINO_API_ENDPOINT);
    } else {
        endpoint = (<string>process.env.API_ENDPOINT);
    }
    let authModel: AuthModel;
    if ((<Express.Session>req.session).auth !== undefined) {
        const authSession = (<Express.Session>req.session).auth.find((auth: IAuthSession) => auth.api === apiEndpoint);
        authModel = new AuthModel(authSession, apiEndpoint);
    } else {
        authModel = new AuthModel({}, apiEndpoint);
    }
    const options = {
        endpoint,
        auth: authModel.create()
    };
    authModel.save(req.session, apiEndpoint);

    return options;
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
