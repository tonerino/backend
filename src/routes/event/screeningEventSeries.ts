/**
 * 上映イベントシリーズマスタ管理ルーター
 */
import { Router } from 'express';

import * as ScreeningEventSeriesController from '../../controllers/event/screeningEventSeries';

const screeningEventSeriesRouter = Router();

screeningEventSeriesRouter.all('/add', ScreeningEventSeriesController.add);
screeningEventSeriesRouter.all('', ScreeningEventSeriesController.index);
screeningEventSeriesRouter.all('/getlist', ScreeningEventSeriesController.getList);
screeningEventSeriesRouter.get('/search', ScreeningEventSeriesController.search);
screeningEventSeriesRouter.all('/:eventId/update', ScreeningEventSeriesController.update);

export default screeningEventSeriesRouter;
