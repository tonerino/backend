/**
 * 券種グループマスタ管理ルーター
 */
import { Router } from 'express';

import * as ticketTypeGroupsController from '../controllers/ticketTypeGroup';

const ticketTypeGroupMasterRouter = Router();

ticketTypeGroupMasterRouter.all('/add', ticketTypeGroupsController.add);
ticketTypeGroupMasterRouter.all('/:id/update', ticketTypeGroupsController.update);
ticketTypeGroupMasterRouter.delete('/:id', ticketTypeGroupsController.deleteById);
ticketTypeGroupMasterRouter.get('/ticketTypeList', ticketTypeGroupsController.getTicketTypeList);
ticketTypeGroupMasterRouter.get('', ticketTypeGroupsController.index);
ticketTypeGroupMasterRouter.get('/getlist', ticketTypeGroupsController.getList);
ticketTypeGroupMasterRouter.get('/getTicketTypePriceList', ticketTypeGroupsController.getTicketTypePriceList);

export default ticketTypeGroupMasterRouter;
