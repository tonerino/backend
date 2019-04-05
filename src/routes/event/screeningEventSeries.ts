/**
 * 上映イベントシリーズマスタ管理ルーター
 */
import { Router } from 'express';

import * as ScreeningEventSeriesController from '../../controllers/event/screeningEventSeries';

const screeningEventSeriesRouter = Router();

screeningEventSeriesRouter.all('/add', ScreeningEventSeriesController.add);
screeningEventSeriesRouter.all('', ScreeningEventSeriesController.index);
screeningEventSeriesRouter.all('/getlist', ScreeningEventSeriesController.getList);
screeningEventSeriesRouter.all('/getrating', ScreeningEventSeriesController.getRating);
screeningEventSeriesRouter.get('/search', ScreeningEventSeriesController.search);
screeningEventSeriesRouter.all('/:eventId/update', ScreeningEventSeriesController.update);
screeningEventSeriesRouter.get('/:eventId/screeningEvents', ScreeningEventSeriesController.searchScreeningEvents);

export default screeningEventSeriesRouter;
