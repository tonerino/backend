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
const user_1 = require("../user");
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
    const options = base_controller_1.getOptions(req, user_1.ApiEndpoint.cinerino);
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
        const options = base_controller_1.getOptions(req, user_1.ApiEndpoint.cinerino);
        const orderService = new cinerino.service.Order(options);
        const transactionService = new cinerino.service.transaction.ReturnOrder(options);
        // 購入場所(customerのクライアントID識別子で判断する、どのアプリで注文されたか、ということ)
        const customerIdentifiers = [];
        switch (req.query.placeTicket) {
            case 'POS':
                customerIdentifiers.push({ name: 'clientId', value: process.env.POS_CLIENT_ID });
                break;
            case 'WEB':
                customerIdentifiers.push({ name: 'clientId', value: process.env.FRONTEND_CLIENT_ID });
                break;
            default:
        }
        let eventStartFrom;
        let eventStartThrough;
        const startDateHourFrom = req.query.startDateHourFrom ? req.query.startDateHourFrom : '00';
        const startDateMinuteFrom = req.query.startDateMinuteFrom ? req.query.startDateMinuteFrom : '00';
        const startDateHourThrough = req.query.startDateHourThrough ? req.query.startDateHourThrough : '23';
        const startDateMinuteThrough = req.query.startDateMinuteThrough ? req.query.startDateMinuteThrough : '55';
        if (req.query.startDate) {
            // tslint:disable-next-line:max-line-length
            eventStartFrom = moment(`${req.query.startDate}T${startDateHourFrom}:${startDateMinuteFrom}:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').toDate();
            // tslint:disable-next-line:max-line-length
            eventStartThrough = moment(`${req.query.startDate}T${startDateHourThrough}:${startDateMinuteThrough}:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').toDate();
        }
        const params = {
            limit: Number(req.query.limit),
            page: Number(req.query.page),
            orderDateFrom: (req.query.orderDateFrom !== undefined && req.query.orderDateFrom !== '')
                ? moment(`${req.query.orderDateFrom}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').toDate()
                : moment(`2018-10-01T00:00:00+09:00`).toDate(),
            orderDateThrough: (req.query.orderDateFrom !== undefined && req.query.orderDateFrom !== '')
                ? moment(`${req.query.orderDateThrough}T23:59:59+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').toDate()
                : moment().toDate(),
            // 購入番号
            customer: {
                typeOf: cinerino.factory.personType.Person,
                // 電話番号
                telephone: req.query.telephone ? req.query.telephone : undefined,
                identifiers: customerIdentifiers
            },
            confirmationNumbers: req.query.confirmationNumber ? [req.query.confirmationNumber] : undefined,
            acceptedOffers: {
                itemOffered: {
                    reservationFor: {
                        startFrom: eventStartFrom,
                        startThrough: eventStartThrough,
                        superEvent: {
                            ids: req.query.screeningEventSeriesId ? [req.query.screeningEventSeriesId] : undefined,
                            location: {
                                branchCodes: [req.query.locationBranchCode]
                            }
                        }
                    }
                }
            }
        };
        debug('searching orders...', params);
        const searchResult = yield orderService.search(params);
        debug(searchResult.totalCount, 'orders found');
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
        debug(err);
        res.json({
            success: false,
            count: 0,
            results: [],
            message: err.message
        });
    }
}));
exports.default = ordersRouter;
