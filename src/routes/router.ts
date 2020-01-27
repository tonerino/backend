/**
 * デフォルトルーター
 */
import * as express from 'express';

import authentication from '../middlewares/authentication';

import authRouter from './auth';
import movieRouter from './creativeWork/movie';
import distributionsMasterRouter from './distributions';
import screeningEventRouter from './event/screeningEvent';
import screeningEventSeriesRouter from './event/screeningEventSeries';
import ordersRouter from './orders';
import movieTheaterRouter from './places/movieTheater';
import serviceTypesRouter from './serviceTypes';
import subjectRouter from './subject';
import ticketTypeMasterRouter from './ticketType';
import ticketTypeGroupMasterRouter from './ticketTypeGroup';

const router = express.Router();
router.use(authRouter);
router.use(authentication);
router.use('/boxOfficeTypes', serviceTypesRouter);
router.use('/creativeWorks/movie', movieRouter);
router.use('/distributions', distributionsMasterRouter);
router.use('/events/screeningEvent', screeningEventRouter);
router.use('/events/screeningEventSeries', screeningEventSeriesRouter);
router.use('/orders', ordersRouter);
router.use('/places/movieTheater', movieTheaterRouter);
router.use('/subjects', subjectRouter);
router.use('/ticketTypes', ticketTypeMasterRouter);
router.use('/ticketTypeGroups', ticketTypeGroupMasterRouter);

router.get('/', (req, res, next) => {
    if (req.query.next !== undefined) {
        next(new Error(req.param('next')));

        return;
    }

    res.redirect('/creativeWorks/movie');
});

export default router;
