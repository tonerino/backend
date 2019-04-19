"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 興行区分管理ルーター
 */
const express_1 = require("express");
const serviceTypeController = require("../controllers/serviceType");
const serviceTypesRouter = express_1.Router();
// 興行区分登録
serviceTypesRouter.all('/add', serviceTypeController.add);
// 興行区分編集
serviceTypesRouter.post('/:id/update', serviceTypeController.update);
// 興行区分一覧
serviceTypesRouter.get('', serviceTypeController.index);
serviceTypesRouter.get('/getlist', serviceTypeController.getList);
exports.default = serviceTypesRouter;
