import { Request, Response } from 'express';
/**
 * 登録完了ページ
 */
export async function complete(__: Request, res: Response): Promise<void> {
    res.render('common/complete');
}
