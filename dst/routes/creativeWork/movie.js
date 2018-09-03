"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 映画作品コントローラー
 */
const express_1 = require("express");
const MovieController = require("../../controllers/creativeWork/movie");
const movieRouter = express_1.Router();
movieRouter.all('/add', MovieController.add);
movieRouter.all('', MovieController.index);
movieRouter.all('/getlist', MovieController.getList);
movieRouter.all('/:identifier/update', MovieController.update);
exports.default = movieRouter;
