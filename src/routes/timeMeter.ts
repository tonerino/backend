/**
 * 時間メータルーター
 */
import * as chevre from '@toei-jp/chevre-api-nodejs-client';
import { Router } from 'express';
import * as moment from 'moment';

const timeMeterRouter = Router();

timeMeterRouter.get('', async (req, res, next) => {
    try {
        const placeService = new chevre.service.Place({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchMovieTheatersResult = await placeService.searchMovieTheaters({});
        if (searchMovieTheatersResult.totalCount === 0) {
            throw new Error('劇場が見つかりません');
        }
        res.render('timeMeter/index', {
            movieTheaters: searchMovieTheatersResult.data,
            message: ''
        });
    } catch (err) {
        next(err);
    }
});
timeMeterRouter.get('/search', async (req, res) => {
    try {
        const eventService = new chevre.service.Event({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const { totalCount, data } = await eventService.countTicketTypePerEvent({
            limit: req.query.limit,
            page: req.query.page,
            startFrom: (req.query.startFrom !== '')
                ? moment(`${req.query.startFrom}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').toDate()
                : undefined,
            startThrough: (req.query.startThrough !== '')
                ? moment(`${req.query.startThrough}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').add(1, 'day').toDate()
                : undefined,
            id: req.query.screeningEventSeries || undefined
        });
        res.json({
            success: true,
            count: totalCount,
            results: data.map((t) => {
                return {
                    ...t,
                    startTime: moment(t.startDate).tz('Asia/Tokyo').format('HH:mm'),
                    startDate: moment(t.startDate).tz('Asia/Tokyo').format('YYYY-MM-DD')
                };
            })
        });
    } catch (err) {
        res.json({
            success: false,
            count: 0,
            results: []
        });
    }
});

export default timeMeterRouter;
