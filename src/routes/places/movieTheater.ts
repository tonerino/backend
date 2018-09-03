/**
 * 劇場ルーター
 */
import * as chevre from '@toei-jp/chevre-api-nodejs-client';
import { Router } from 'express';

const movieTheaterRouter = Router();
movieTheaterRouter.get('', (_, res) => {
    res.render('places/movieTheater/index', {
        message: ''
    });
});
movieTheaterRouter.get('/search', async (req, res) => {
    try {
        const placeService = new chevre.service.Place({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const { totalCount, data } = await placeService.searchMovieTheaters({
            limit: req.query.limit,
            page: req.query.page,
            name: req.query.name
        });
        res.json({
            success: true,
            count: totalCount,
            results: data
        });
    } catch (err) {
        res.json({
            success: false,
            count: 0,
            results: []
        });
    }
});
export default movieTheaterRouter;
