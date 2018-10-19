"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 興行区分マスタ管理ルーター
 */
const express_1 = require("express");
const boxOfficeTypeController = require("../controllers/boxOfficeType");
const boxOfficeTypeMasterRouter = express_1.Router();
// 興行区分登録
boxOfficeTypeMasterRouter.all('/add', boxOfficeTypeController.add);
// 興行区分編集
boxOfficeTypeMasterRouter.post('/:id/update', boxOfficeTypeController.update);
// 興行区分一覧
boxOfficeTypeMasterRouter.get('', boxOfficeTypeController.index);
boxOfficeTypeMasterRouter.get('/getlist', boxOfficeTypeController.getList);
exports.default = boxOfficeTypeMasterRouter;
