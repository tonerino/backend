/**
 * 券種マスタ管理ルーター
 */
import { Router } from 'express';
import * as ticketTypeController from '../controllers/ticketType';

const ticketTypeMasterRouter = Router();

// 券種登録
ticketTypeMasterRouter.all('/add', ticketTypeController.add);
// 券種編集
ticketTypeMasterRouter.all('/:id/update', ticketTypeController.update);
// 券種一覧
ticketTypeMasterRouter.get('', ticketTypeController.index);
ticketTypeMasterRouter.get('/getlist', ticketTypeController.getList);

export default ticketTypeMasterRouter;
