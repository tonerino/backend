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
 * 予約ルーター
 */
const chevre = require("@chevre/api-nodejs-client");
const express_1 = require("express");
const moment = require("moment");
const reservationsRouter = express_1.Router();
reservationsRouter.get('', (_, res) => {
    res.render('reservations/index', {
        message: ''
    });
});
reservationsRouter.get('/search', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        const reservationService = new chevre.service.Reservation({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const { totalCount, data } = yield reservationService.searchScreeningEventReservations({
            limit: req.query.limit,
            page: req.query.page,
            modifiedFrom: (req.query.modifiedFrom !== '')
                ? moment(`${req.query.modifiedFrom}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').toDate()
                : undefined,
            modifiedThrough: (req.query.modifiedThrough !== '')
                ? moment(`${req.query.modifiedThrough}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').add(1, 'day').toDate()
                : undefined
            // name: req.query.name
        });
        res.json({
            success: true,
            count: totalCount,
            results: data.map((t) => {
                return t;
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
exports.default = reservationsRouter;
