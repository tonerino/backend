"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 時間メータルーター
 */
const chevre = require("@chevre/api-nodejs-client");
const express_1 = require("express");
const moment = require("moment");
const timeMeterRouter = express_1.Router();
timeMeterRouter.get('', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const placeService = new chevre.service.Place({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchMovieTheatersResult = yield placeService.searchMovieTheaters({});
        if (searchMovieTheatersResult.totalCount === 0) {
            throw new Error('劇場が見つかりません');
        }
        res.render('timeMeter/index', {
            movieTheaters: searchMovieTheatersResult.data,
            message: ''
        });
    }
    catch (err) {
        next(err);
    }
}));
timeMeterRouter.get('/search', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        const eventService = new chevre.service.Event({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const { totalCount, data } = yield eventService.searchWithAggregateReservation({
            typeOf: chevre.factory.eventType.ScreeningEvent,
            limit: req.query.limit,
            page: req.query.page,
            startFrom: (req.query.startFrom !== '')
                ? moment(`${String(req.query.startFrom)}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').toDate()
                : undefined,
            startThrough: (req.query.startThrough !== '')
                ? moment(`${String(req.query.startThrough)}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').add(1, 'day').toDate()
                : undefined,
            superEvent: {
                ids: (req.query.screeningEventSeries !== undefined && req.query.screeningEventSeries !== '')
                    ? [String(req.query.screeningEventSeries)]
                    : undefined,
                locationBranchCodes: (req.query.theater !== undefined && req.query.theater !== '')
                    ? [String(req.query.theater)]
                    : undefined
            }
        });
        res.json({
            success: true,
            count: totalCount,
            results: data.map((t) => {
                return Object.assign({}, t, { startTime: moment(t.startDate).tz('Asia/Tokyo').format('HH:mm'), startDate: moment(t.startDate).tz('Asia/Tokyo').format('YYYY-MM-DD') });
            })
        });
    }
    catch (err) {
        res.json({
            success: false,
            count: 0,
            results: []
        });
    }
}));
exports.default = timeMeterRouter;
