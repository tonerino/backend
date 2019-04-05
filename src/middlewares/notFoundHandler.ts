/**
 * 404ハンドラーミドルウェア
 */

import { Request, Response } from 'express';

import * as ErrorController from '../controllers/error';

export default (req: Request, res: Response) => {
    ErrorController.notFound(req, res);
};
