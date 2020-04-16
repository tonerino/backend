/**
 * サービス終了ミドルウェア
 */
import { NextFunction, Request, Response } from 'express';
import * as moment from 'moment';

import * as ErrorController from '../controllers/error';

const END_OF_SERVICE = process.env.END_OF_SERVICE;

export default async (req: Request, res: Response, next: NextFunction) => {
    try {
        const now = moment();
        if (typeof END_OF_SERVICE === 'string') {
            if (now.isSameOrAfter(moment(END_OF_SERVICE))) {
                ErrorController.badRequest(new Error('サービスは終了しました'), req, res);

                return;
            }

        }

        next();
    } catch (error) {
        next(error);
    }
};
