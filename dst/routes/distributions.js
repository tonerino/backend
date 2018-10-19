"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 配給マスタ管理ルーター
 */
const express_1 = require("express");
const distributionsController = require("../controllers/distributions");
const distributionsMasterRouter = express_1.Router();
// 配給登録
distributionsMasterRouter.all('/add', distributionsController.add);
// 配給編集
distributionsMasterRouter.post('/:id/update', distributionsController.update);
// 配給一覧
distributionsMasterRouter.get('', distributionsController.index);
distributionsMasterRouter.get('/getlist', distributionsController.getList);
exports.default = distributionsMasterRouter;
