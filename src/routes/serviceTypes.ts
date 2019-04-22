/**
 * 興行区分管理ルーター
 */
import { Router } from 'express';
import * as serviceTypeController from '../controllers/serviceType';

const serviceTypesRouter = Router();

// 興行区分登録
serviceTypesRouter.all('/add', serviceTypeController.add);
// 興行区分編集
serviceTypesRouter.post('/:id/update', serviceTypeController.update);
// 興行区分一覧
serviceTypesRouter.get('', serviceTypeController.index);
serviceTypesRouter.get('/getlist', serviceTypeController.getList);

export default serviceTypesRouter;
