/**
 * 配給マスタ管理ルーター
 */
import { Router } from 'express';
import * as distributionsController from '../controllers/distributions';

const distributionsMasterRouter = Router();

// 配給登録
distributionsMasterRouter.all('/add', distributionsController.add);
// 配給編集
distributionsMasterRouter.post('/:id/update', distributionsController.update);
// 配給一覧
distributionsMasterRouter.get('', distributionsController.index);
distributionsMasterRouter.get('/getlist', distributionsController.getList);

export default distributionsMasterRouter;
