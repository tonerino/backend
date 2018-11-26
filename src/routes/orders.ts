/**
 * 注文ルーター
 */
import * as chevre from '@toei-jp/chevre-api-nodejs-client';
import * as cinerino from '@cinerino/api-nodejs-client';
import * as createDebug from 'debug';
import { Router } from 'express';
import * as moment from 'moment';
import * as util from 'util';

import { getOptions } from '../controllers/base/base.controller';
import { ApiEndpoint } from '../user';

const ordersRouter = Router();
const debug = createDebug('chevre-backend:orders');

ordersRouter.get('', async (req, res, next) => {
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
    } catch (err) {
        next(err);
    }
});
ordersRouter.get('/cancel', async (req, res) => {
    const options = getOptions(req, ApiEndpoint.cinerino);
    const returnOrderService = new cinerino.service.txn.ReturnOrder(options);

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
        void returnOrderService.confirm(transaction);

        res.json({ success: true });
    } catch (error) {
        res.json({ success: false });
    }
});
// tslint:disable-next-line:max-func-body-length
ordersRouter.get('/search', async (req, res) => {
    try {
        const options = getOptions(req, ApiEndpoint.cinerino);
        const orderService = new cinerino.service.Order(options);
        const transactionService = new cinerino.service.txn.ReturnOrder(options);

        // 購入場所(customerのクライアントID識別子で判断する、どのアプリで注文されたか、ということ)
        const customerIdentifiers = [];
        switch (req.query.placeTicket) {
            case 'POS':
                customerIdentifiers.push({ name: 'clientId', value: <string>process.env.POS_CLIENT_ID });
                break;
            case 'WEB':
                customerIdentifiers.push({ name: 'clientId', value: <string>process.env.FRONTEND_CLIENT_ID });
                break;
            default:
        }

        let eventStartFrom: Date | undefined;
        let eventStartThrough: Date | undefined;
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

        const params: cinerino.factory.order.ISearchConditions = {
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
        const searchResult = await orderService.search(params);
        debug(searchResult.totalCount, 'orders found');

        //キャンセル処理しているオーダーの取得
        const orderNotCanceled: string[] = searchResult.data.filter((d: cinerino.factory.order.IOrder) => d.acceptedOffers.length > 0)
            .filter((d: cinerino.factory.order.IOrder) => d.orderStatus !== cinerino.factory.orderStatus.OrderReturned)
            .map((d: cinerino.factory.order.IOrder) => d.orderNumber);

        let orderCancellings: string[] = [];
        if (orderNotCanceled.length > 0) {
            orderCancellings = await transactionService.search({
                typeOf: cinerino.factory.transactionType.ReturnOrder,
                object: { order: { orderNumbers: orderNotCanceled } }
            }).then((docs: any) => docs.data.map((d: any) => d.object.order.orderNumber));
        }

        res.json({
            success: true,
            count: searchResult.totalCount,
            results: searchResult.data.map((o) => {
                return {
                    ...o,
                    paymentMethodId: o.paymentMethods.map((p) => p.paymentMethodId).join(','),
                    ticketInfo: o.acceptedOffers.map((offer) => {
                        // tslint:disable-next-line:max-line-length
                        const priceComponent = <chevre.factory.priceSpecification.IPriceSpecification<chevre.factory.priceSpecificationType.UnitPriceSpecification> | undefined>
                            offer.itemOffered.price.priceComponent.find(
                                (component) => component.typeOf === chevre.factory.priceSpecificationType.UnitPriceSpecification
                            );
                        const price = (priceComponent !== undefined)
                            ? `${priceComponent.price}(${priceComponent.referenceQuantity.value}枚)円`
                            : '';

                        return util.format(
                            '%s / %s / %s',
                            offer.itemOffered.reservedTicket.ticketedSeat.seatNumber,
                            offer.itemOffered.additionalTicketText,
                            price
                        );
                    }).join('<br>')
                };
            }),
            orderCancellings: orderCancellings
        });
    } catch (err) {
        debug(err);
        res.json({
            success: false,
            count: 0,
            results: [],
            message: err.message
        });
    }
});
export default ordersRouter;
