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
 * 注文ルーター
 */
const chevre = require("@toei-jp/chevre-api-nodejs-client");
const cinerino = require("@toei-jp/cinerino-api-nodejs-client");
const createDebug = require("debug");
const express_1 = require("express");
const moment = require("moment");
const base_controller_1 = require("../controllers/base/base.controller");
const auth_model_1 = require("../models/auth/auth.model");
const ordersRouter = express_1.Router();
const debug = createDebug('chevre-backend:orders');
ordersRouter.get('', (req, res) => __awaiter(this, void 0, void 0, function* () {
    const placeService = new chevre.service.Place({
        endpoint: process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    try {
        const searchMovieTheatersResult = yield placeService.searchMovieTheaters({});
        res.render('orders/index', {
            message: '',
            movieTheaters: searchMovieTheatersResult.data
        });
    }
    catch (error) {
        const searchMovieTheatersResult = yield placeService.searchMovieTheaters({});
        res.render('orders/index', {
            message: '',
            movieTheaters: searchMovieTheatersResult.data
        });
    }
}));
ordersRouter.get('/cancel', (req, res) => __awaiter(this, void 0, void 0, function* () {
    const options = base_controller_1.getOptions(req, auth_model_1.ApiEndpoint.cinerino);
    const returnOrderService = new cinerino.service.transaction.ReturnOrder(options);
    try {
        const transaction = yield returnOrderService.start({
            // tslint:disable-next-line:no-magic-numbers
            expires: moment().add(15, 'minutes').toDate(),
            object: {
                order: {
                    orderNumber: req.query.orderNumber ? req.query.orderNumber : undefined
                }
            }
        });
        void returnOrderService.confirm({
            transactionId: transaction.id
        });
        res.json({ success: true });
    }
    catch (error) {
        res.json({ success: false });
    }
}));
ordersRouter.get('/search', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        const options = base_controller_1.getOptions(req, auth_model_1.ApiEndpoint.cinerino);
        const orderService = new cinerino.service.Order(options);
        const transactionService = new cinerino.service.transaction.ReturnOrder(options);
        const params = {
            limit: req.query.limit,
            page: req.query.page,
            locationBranchCode: req.query.locationBranchCode,
            orderDateFrom: (req.query.orderDateFrom)
                ? moment(`${req.query.orderDateFrom}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').toDate() : undefined,
            orderDateThrough: (req.query.orderDateThrough)
                ? moment(`${req.query.orderDateThrough}T23:59:59+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').toDate() : undefined,
            screeningEventSeriesId: req.query.screeningEventSeriesId ? req.query.screeningEventSeriesId : undefined,
            // 購入番号
            confirmationNumber: req.query.confirmationNumber ? req.query.confirmationNumber : undefined,
            // 電話番号
            telephone: req.query.telephone ? req.query.telephone : undefined,
            // 購入場所
            placeTicket: req.query.placeTicket ? req.query.placeTicket : undefined
        };
        const startDateHourFrom = req.query.startDateHourFrom ? req.query.startDateHourFrom : '00';
        const startDateMinuteFrom = req.query.startDateMinuteFrom ? req.query.startDateMinuteFrom : '00';
        const startDateHourThrough = req.query.startDateHourThrough ? req.query.startDateHourThrough : '23';
        const startDateMinuteThrough = req.query.startDateMinuteThrough ? req.query.startDateMinuteThrough : '55';
        if (req.query.startDate) {
            // tslint:disable-next-line:max-line-length
            params.reservedEventStartDateFrom = moment(`${req.query.startDate}T${startDateHourFrom}:${startDateMinuteFrom}:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').toDate();
            // tslint:disable-next-line:max-line-length
            params.reservedEventStartDateThrough = moment(`${req.query.startDate}T${startDateHourThrough}:${startDateMinuteThrough}:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').toDate();
        }
        const searchResult = yield orderService.searchOrder(params);
        debug('orders response', searchResult.data);
        //キャンセル処理しているオーダーの取得
        const orderNotCanceled = searchResult.data.filter((d) => d.acceptedOffers.length > 0)
            .filter((d) => d.orderStatus !== cinerino.factory.orderStatus.OrderReturned)
            .map((d) => d.orderNumber);
        let orderCancellings = [];
        if (orderNotCanceled.length > 0) {
            orderCancellings = yield transactionService.search({
                typeOf: cinerino.factory.transactionType.ReturnOrder,
                object: { order: { orderNumbers: orderNotCanceled } }
            }).then((docs) => docs.data.map((d) => d.object.order.orderNumber));
        }
        res.json({
            success: true,
            count: searchResult.totalCount,
            results: searchResult.data.map((t) => {
                return t;
            }),
            orderCancellings: orderCancellings
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
exports.default = ordersRouter;
//# sourceMappingURL=orders.js.map