/**
 * 劇場ルーター
 */
import * as chevre from '@chevre/api-nodejs-client';
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

        const limit = Number(req.query.limit);
        const page = Number(req.query.page);
        const { data } = await placeService.searchMovieTheaters({
            limit: limit,
            page: page,
            project: { ids: [req.project.id] },
            name: req.query.name
        });

        const results = data.map((movieTheater) => {
            const availabilityEndsGraceTimeInMinutes =
                (movieTheater.offers !== undefined
                    && movieTheater.offers.availabilityEndsGraceTime !== undefined
                    && movieTheater.offers.availabilityEndsGraceTime.value !== undefined)
                    // tslint:disable-next-line:no-magic-numbers
                    ? Math.floor(movieTheater.offers.availabilityEndsGraceTime.value / 60)
                    : undefined;

            return {
                ...movieTheater,
                availabilityStartsGraceTimeInDays:
                    (movieTheater.offers !== undefined
                        && movieTheater.offers.availabilityStartsGraceTime !== undefined
                        && movieTheater.offers.availabilityStartsGraceTime.value !== undefined)
                        // tslint:disable-next-line:no-magic-numbers
                        ? -movieTheater.offers.availabilityStartsGraceTime.value
                        : undefined,
                availabilityEndsGraceTimeInMinutes:
                    (availabilityEndsGraceTimeInMinutes !== undefined)
                        ? (availabilityEndsGraceTimeInMinutes >= 0)
                            ? `${availabilityEndsGraceTimeInMinutes}分後`
                            : `${-availabilityEndsGraceTimeInMinutes}分前`
                        : undefined
            };
        });

        res.json({
            success: true,
            count: (data.length === Number(limit))
                ? (Number(page) * Number(limit)) + 1
                : ((Number(page) - 1) * Number(limit)) + Number(data.length),
            results: results
        });
    } catch (err) {
        res.json({
            success: false,
            count: 0,
            results: []
        });
    }
});
movieTheaterRouter.get('/getScreenListByTheaterBranchCode', async (req, res) => {
    try {
        const branchCode = req.query.branchCode;

        const placeService = new chevre.service.Place({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        const searchMovieTheatersResult = await placeService.searchMovieTheaters({
            project: { ids: [req.project.id] },
            branchCodes: [branchCode]
        });
        const movieTheaterWithoutScreeningRoom = searchMovieTheatersResult.data.shift();
        if (movieTheaterWithoutScreeningRoom === undefined) {
            throw new Error(`Movie Theater ${branchCode} Not Found`);
        }
        const place = await placeService.findMovieTheaterById({ id: movieTheaterWithoutScreeningRoom.id });

        const results = place.containsPlace.map((screen) => ({
            branchCode: screen.branchCode,
            name: (screen.name !== undefined) ? (<any>screen.name).ja : ''
        }));
        results.sort((screen1, screen2) => {
            if (screen1.name > screen2.name) {
                return 1;
            }
            if (screen1.name < screen2.name) {
                return -1;
            }

            return 0;
        });
        res.json({
            success: true,
            results
        });
    } catch (err) {
        res.json({
            success: false,
            results: []
        });
    }
});
export default movieTheaterRouter;
