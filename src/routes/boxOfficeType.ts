/**
 * 興行区分マスタ管理ルーター
 */
import { Router } from 'express';
import * as boxOfficeTypeController from '../controllers/boxOfficeType';

const boxOfficeTypeMasterRouter = Router();

// 興行区分登録
boxOfficeTypeMasterRouter.all('/add', boxOfficeTypeController.add);
// 興行区分編集
boxOfficeTypeMasterRouter.post('/:id/update', boxOfficeTypeController.update);
// 興行区分一覧
boxOfficeTypeMasterRouter.get('', boxOfficeTypeController.index);
boxOfficeTypeMasterRouter.get('/getlist', boxOfficeTypeController.getList);

export default boxOfficeTypeMasterRouter;
