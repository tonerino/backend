"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 券種グループマスタ管理ルーター
 */
const express_1 = require("express");
const ticketTypeGroupsController = require("../controllers/ticketTypeGroup");
const ticketTypeGroupMasterRouter = express_1.Router();
ticketTypeGroupMasterRouter.all('/add', ticketTypeGroupsController.add);
ticketTypeGroupMasterRouter.all('/:id/update', ticketTypeGroupsController.update);
ticketTypeGroupMasterRouter.delete('/:id', ticketTypeGroupsController.deleteById);
ticketTypeGroupMasterRouter.get('/ticketTypeList', ticketTypeGroupsController.getTicketTypeList);
ticketTypeGroupMasterRouter.get('', ticketTypeGroupsController.index);
ticketTypeGroupMasterRouter.get('/getlist', ticketTypeGroupsController.getList);
ticketTypeGroupMasterRouter.get('/getTicketTypePriceList', ticketTypeGroupsController.getTicketTypePriceList);
exports.default = ticketTypeGroupMasterRouter;
