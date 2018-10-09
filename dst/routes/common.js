"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * commonコントローラー
 */
const express_1 = require("express");
const CommomController = require("../controllers/common");
const commonRouter = express_1.Router();
commonRouter.all('/complete', CommomController.complete);
exports.default = commonRouter;
