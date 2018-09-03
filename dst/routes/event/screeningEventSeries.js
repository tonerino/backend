"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 上映イベントシリーズマスタ管理ルーター
 */
const express_1 = require("express");
const ScreeningEventSeriesController = require("../../controllers/event/screeningEventSeries");
const screeningEventSeriesRouter = express_1.Router();
screeningEventSeriesRouter.all('/add', ScreeningEventSeriesController.add);
screeningEventSeriesRouter.all('', ScreeningEventSeriesController.index);
screeningEventSeriesRouter.all('/getlist', ScreeningEventSeriesController.getList);
screeningEventSeriesRouter.all('/:eventId/update', ScreeningEventSeriesController.update);
exports.default = screeningEventSeriesRouter;
