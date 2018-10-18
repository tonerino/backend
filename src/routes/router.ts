/**
 * デフォルトルーター
 */
import * as express from 'express';

import authentication from '../middlewares/authentication';

import authRouter from './auth';
import commonRouter from './common';
import movieRouter from './creativeWork/movie';
import distributionsRouter from './distributions';
import screeningEventRouter from './event/screeningEvent';
import screeningEventSeriesRouter from './event/screeningEventSeries';
import movieTheaterRouter from './places/movieTheater';
import reservationsRouter from './reservations';
import subjectRouter from './subject';
import ticketTypeMasterRouter from './ticketType';
import ticketTypeGroupMasterRouter from './ticketTypeGroup';
import timeMeterRouter from './timeMeter';

const router = express.Router();
router.use(authRouter);
router.use(authentication);
router.use('/creativeWorks/movie', movieRouter);
router.use('/distributions', distributionsRouter);
router.use('/events/screeningEvent', screeningEventRouter);
router.use('/events/screeningEventSeries', screeningEventSeriesRouter);
router.use('/places/movieTheater', movieTheaterRouter);
router.use('/reservations', reservationsRouter);
router.use('/subjects', subjectRouter);
router.use('/timeMeter', timeMeterRouter);
router.use('/ticketTypes', ticketTypeMasterRouter);
router.use('/ticketTypeGroups', ticketTypeGroupMasterRouter);
router.use(commonRouter);

router.get('/', (req, res, next) => {
    if (req.query.next !== undefined) {
        next(new Error(req.param('next')));

        return;
    }

    res.redirect('/creativeWorks/movie');
});

export default router;
