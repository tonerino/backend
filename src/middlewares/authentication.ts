/**
 * 認証ミドルウェア
 */
import { NextFunction, Request, Response } from 'express';

import User from '../user';

export default async (req: Request, res: Response, next: NextFunction) => {
    try {
        req.user = new User({
            host: req.hostname,
            session: <Express.Session>req.session
        });

        if (process.env.PROJECT_ID === undefined) {
            throw new Error('Set environment variable `PROJECT_ID`');
        }

        req.project = {
            typeOf: 'Project',
            id: process.env.PROJECT_ID
        };

        if (!req.user.isAuthenticated()) {
            // ログインページへリダイレクト
            res.redirect(req.user.generateAuthUrl());

            return;
        }

        await req.user.retrieveProfile();
        res.locals.user = req.user;
        next();
    } catch (error) {
        next(error);
    }
};
