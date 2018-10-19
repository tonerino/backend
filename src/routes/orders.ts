/**
 * 注文ルーター
 */
import * as chevre from '@toei-jp/chevre-api-nodejs-client';
import * as cinerino from '@toei-jp/cinerino-api-nodejs-client';
import * as createDebug from 'debug';
import { Router } from 'express';
import * as moment from 'moment';
import { getOptions } from '../controllers/base/base.controller';
import { ApiEndpoint } from '../models/auth/auth.model';

const ordersRouter = Router();
const debug = createDebug('chevre-backend:orders');

ordersRouter.get('', async (req, res) => {
    const placeService = new chevre.service.Place({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });

    try {
        const searchMovieTheatersResult = await placeService.searchMovieTheaters({});
        res.render('orders/index', {
            message: '',
            movieTheaters: searchMovieTheatersResult.data
        });
    } catch (error) {
        const searchMovieTheatersResult = await placeService.searchMovieTheaters({});
        res.render('orders/index', {
            message: '',
            movieTheaters: searchMovieTheatersResult.data
        });
    }
});
ordersRouter.get('/cancel', async (req, res) => {
    const options = getOptions(req, ApiEndpoint.cinerino);
    const returnOrderService = new cinerino.service.transaction.ReturnOrder(options);

    try {
        const transaction = await returnOrderService.start({
            // tslint:disable-next-line:no-magic-numbers
            expires: moment().add(15, 'minutes').toDate(),
            object: {
                order: {
                    orderNumber: req.query.orderNumber ? req.query.orderNumber : undefined
                }
            }
        });
        returnOrderService.confirm({
            transactionId: transaction.id
        });

        res.json({success: true});
    } catch (error) {
        res.json({success: false});
    }
});
ordersRouter.get('/search', async (req, res) => {
    try {
        const options = getOptions(req, ApiEndpoint.cinerino);
        const orderService = new cinerino.service.Order(options);
        const transactionService = new cinerino.service.transaction.ReturnOrder(options);

        const params: cinerino.factory.order.ISearchOrdersConditions = {
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

        const searchResult = await orderService.searchOrder(params);
        debug('orders response', searchResult.data);

        //キャンセル処理しているオーダーの取得
        const orderNotCanceled: string[] = searchResult.data.filter((d) => d.acceptedOffers.length > 0)
        .filter((d) => d.orderStatus !== cinerino.factory.orderStatus.OrderReturned)
        .map((d) => d.orderNumber);

        let orderCancellings: string[] = [];
        if (orderNotCanceled.length > 0) {
            orderCancellings = await transactionService.search({
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
    } catch (err) {
        res.json({
            success: false,
            count: 0,
            results: []
        });
    }
});
export default ordersRouter;
