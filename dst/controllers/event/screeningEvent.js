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
 * 上映イベントコントローラー
 */
const chevre = require("@toei-jp/chevre-api-nodejs-client");
const createDebug = require("debug");
const http_status_1 = require("http-status");
const moment = require("moment");
const debug = createDebug('chevre-backend:controllers');
const DEFAULT_OFFERS_VALID_AFTER_START_IN_MINUTES = -30;
function index(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const ticketTypeService = new chevre.service.TicketType({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const placeService = new chevre.service.Place({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const searchMovieTheatersResult = yield placeService.searchMovieTheaters({});
            if (searchMovieTheatersResult.totalCount === 0) {
                throw new Error('劇場が見つかりません');
            }
            const searchTicketTypeGroupsResult = yield ticketTypeService.searchTicketTypeGroups({});
            res.render('events/screeningEvent/index', {
                movieTheaters: searchMovieTheatersResult.data,
                moment: moment,
                ticketGroups: searchTicketTypeGroupsResult.data
            });
        }
        catch (err) {
            next(err);
        }
    });
}
exports.index = index;
function search(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const ticketTypeService = new chevre.service.TicketType({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const eventService = new chevre.service.Event({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const placeService = new chevre.service.Place({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        try {
            const date = req.query.date;
            const days = req.query.days;
            const screen = req.query.screen;
            const movieTheater = yield placeService.findMovieTheaterByBranchCode({ branchCode: req.query.theater });
            const searchResult = yield eventService.searchScreeningEvents({
                eventStatuses: [chevre.factory.eventStatusType.EventScheduled],
                inSessionFrom: moment(`${date}T00:00:00+09:00`, 'YYYYMMDDTHH:mm:ssZ').toDate(),
                inSessionThrough: moment(`${date}T00:00:00+09:00`, 'YYYYMMDDTHH:mm:ssZ').add(days, 'day').toDate(),
                superEvent: {
                    locationBranchCodes: [movieTheater.branchCode]
                }
            });
            let data;
            let screens;
            if (screen !== undefined) {
                data = searchResult.data.filter((event) => event.location.branchCode === screen);
                if (searchResult.data.length < searchResult.totalCount) {
                    let dataPage2;
                    const searchResultPage2 = yield eventService.searchScreeningEvents({
                        eventStatuses: [chevre.factory.eventStatusType.EventScheduled],
                        inSessionFrom: moment(`${date}T00:00:00+09:00`, 'YYYYMMDDTHH:mm:ssZ').toDate(),
                        inSessionThrough: moment(`${date}T00:00:00+09:00`, 'YYYYMMDDTHH:mm:ssZ').add(days, 'day').toDate(),
                        superEvent: {
                            locationBranchCodes: [movieTheater.branchCode]
                        },
                        page: 2
                    });
                    dataPage2 = searchResultPage2.data.filter((event) => event.location.branchCode === screen);
                    for (const dataP2 of dataPage2) {
                        data.push(dataP2);
                    }
                }
                screens = movieTheater.containsPlace.filter((place) => place.branchCode === screen);
            }
            else {
                data = searchResult.data;
                screens = movieTheater.containsPlace;
            }
            const searchTicketTypeGroupsResult = yield ticketTypeService.searchTicketTypeGroups({});
            res.json({
                validation: null,
                error: null,
                performances: data,
                screens,
                ticketGroups: searchTicketTypeGroupsResult.data
            });
        }
        catch (err) {
            debug('search error', err);
            res.json({
                validation: null,
                error: err.message
            });
        }
    });
}
exports.search = search;
/**
 * 作品検索
 */
function searchScreeningEventSeries(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const eventService = new chevre.service.Event({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        try {
            const searchResult = yield eventService.searchScreeningEventSeries({
                location: {
                    branchCodes: [req.query.movieTheaterBranchCode]
                },
                workPerformed: {
                    identifiers: [req.query.identifier]
                }
            });
            res.json({
                validation: null,
                error: null,
                screeningEventSeries: searchResult.data
            });
        }
        catch (err) {
            debug('searchScreeningEvent error', err);
            res.json({
                validation: null,
                error: err.message
            });
        }
    });
}
exports.searchScreeningEventSeries = searchScreeningEventSeries;
/**
 * 新規登録
 */
function regist(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const eventService = new chevre.service.Event({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            addValidation(req);
            const validatorResult = yield req.getValidationResult();
            const validations = req.validationErrors(true);
            if (!validatorResult.isEmpty()) {
                res.json({
                    validation: validations,
                    error: null
                });
                return;
            }
            debug('saving screening event...', req.body);
            const attributes = yield createMultipleEventFromBody(req.body, req.user);
            yield eventService.createMultipleScreeningEvent(attributes);
            res.json({
                validation: null,
                error: null
            });
        }
        catch (err) {
            debug('regist error', err);
            const obj = {
                validation: null,
                error: err.message
            };
            if (err.code === http_status_1.BAD_REQUEST) {
                res.status(err.code).json(obj);
            }
            else {
                res.json(obj);
            }
        }
    });
}
exports.regist = regist;
/**
 * 更新
 */
function update(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const eventService = new chevre.service.Event({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            updateValidation(req);
            const validatorResult = yield req.getValidationResult();
            const validations = req.validationErrors(true);
            if (!validatorResult.isEmpty()) {
                res.json({
                    validation: validations,
                    error: null
                });
                return;
            }
            debug('saving screening event...', req.body);
            const attributes = yield createEventFromBody(req.body, req.user);
            yield eventService.updateScreeningEvent({
                id: req.params.eventId,
                attributes: attributes
            });
            res.json({
                validation: null,
                error: null
            });
        }
        catch (err) {
            debug('update error', err);
            res.json({
                validation: null,
                error: err.message
            });
        }
    });
}
exports.update = update;
/**
 * 物理削除ではなくイベントキャンセル
 */
function cancelPerformance(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const eventService = new chevre.service.Event({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const event = yield eventService.findScreeningEventById({ id: req.params.eventId });
            if (moment(event.startDate).tz('Asia/Tokyo').isSameOrAfter(moment().tz('Asia/Tokyo'), 'day')) {
                event.eventStatus = chevre.factory.eventStatusType.EventCancelled;
                yield eventService.updateScreeningEvent({ id: event.id, attributes: event });
                res.json({
                    validation: null,
                    error: null
                });
            }
            else {
                res.json({
                    validation: null,
                    error: '開始日時'
                });
            }
        }
        catch (err) {
            debug('delete error', err);
            res.status(http_status_1.NO_CONTENT).json({
                validation: null,
                error: err.message
            });
        }
    });
}
exports.cancelPerformance = cancelPerformance;
/**
 * リクエストボディからイベントオブジェクトを作成する
 */
// tslint:disable-next-line:max-func-body-length
function createEventFromBody(body, user) {
    return __awaiter(this, void 0, void 0, function* () {
        const eventService = new chevre.service.Event({
            endpoint: process.env.API_ENDPOINT,
            auth: user.authClient
        });
        const placeService = new chevre.service.Place({
            endpoint: process.env.API_ENDPOINT,
            auth: user.authClient
        });
        const ticketTypeService = new chevre.service.TicketType({
            endpoint: process.env.API_ENDPOINT,
            auth: user.authClient
        });
        const boxOfficeTypeService = new chevre.service.BoxOfficeType({
            endpoint: process.env.API_ENDPOINT,
            auth: user.authClient
        });
        const screeningEventSeries = yield eventService.findScreeningEventSeriesById({
            id: body.screeningEventId
        });
        const movieTheater = yield placeService.findMovieTheaterByBranchCode({ branchCode: body.theater });
        const screeningRoom = movieTheater.containsPlace.find((p) => p.branchCode === body.screen);
        if (screeningRoom === undefined) {
            throw new Error('上映スクリーンが見つかりません');
        }
        if (screeningRoom.name === undefined) {
            throw new Error('上映スクリーン名が見つかりません');
        }
        const ticketTypeGroup = yield ticketTypeService.findTicketTypeGroupById({ id: body.ticketTypeGroup });
        const searchBoxOfficeTypeResult = yield boxOfficeTypeService.searchBoxOfficeType({ id: ticketTypeGroup.boxOfficeType.id });
        if (searchBoxOfficeTypeResult.totalCount === 0) {
            throw new Error('興行区分が見つかりません');
        }
        const serviceType = searchBoxOfficeTypeResult.data[0];
        const offersValidAfterStart = (body.endSaleTimeAfterScreening !== undefined && body.endSaleTimeAfterScreening !== '')
            ? Number(body.endSaleTimeAfterScreening)
            : DEFAULT_OFFERS_VALID_AFTER_START_IN_MINUTES;
        const startDate = moment(`${body.day}T${body.startTime}+09:00`, 'YYYYMMDDTHHmmZ').toDate();
        const salesStartDate = moment(`${body.saleStartDate}T${body.saleStartTime}+09:00`, 'YYYYMMDDTHHmmZ').toDate();
        const salesEndDate = moment(startDate).add(offersValidAfterStart, 'minutes').toDate();
        const onlineDisplayStartDate = moment(`${body.onlineDisplayStartDate}T00:00:00+09:00`, 'YYYYMMDDTHH:mm:ssZ').toDate();
        let acceptedPaymentMethod;
        // ムビチケ除外の場合は対応決済方法を追加
        if (body.mvtkExcludeFlg === '1') {
            Object.keys(chevre.factory.paymentMethodType).forEach((key) => {
                if (acceptedPaymentMethod === undefined) {
                    acceptedPaymentMethod = [];
                }
                const paymentMethodType = chevre.factory.paymentMethodType[key];
                if (paymentMethodType !== chevre.factory.paymentMethodType.MovieTicket) {
                    acceptedPaymentMethod.push(paymentMethodType);
                }
            });
        }
        const offers = {
            typeOf: 'Offer',
            priceCurrency: chevre.factory.priceCurrency.JPY,
            availabilityEnds: salesEndDate,
            availabilityStarts: onlineDisplayStartDate,
            category: {
                id: ticketTypeGroup.id,
                name: ticketTypeGroup.name
            },
            eligibleQuantity: {
                typeOf: 'QuantitativeValue',
                unitCode: chevre.factory.unitCode.C62,
                maxValue: Number(body.maxSeatNumber),
                value: 1
            },
            itemOffered: {
                serviceType: {
                    typeOf: 'ServiceType',
                    id: serviceType.id,
                    name: serviceType.name
                }
            },
            validFrom: salesStartDate,
            validThrough: salesEndDate,
            acceptedPaymentMethod: acceptedPaymentMethod
        };
        return {
            typeOf: chevre.factory.eventType.ScreeningEvent,
            doorTime: moment(`${body.day}T${body.doorTime}+09:00`, 'YYYYMMDDTHHmmZ').toDate(),
            startDate: startDate,
            endDate: moment(`${body.day}T${body.endTime}+09:00`, 'YYYYMMDDTHHmmZ').toDate(),
            workPerformed: screeningEventSeries.workPerformed,
            location: {
                typeOf: screeningRoom.typeOf,
                branchCode: screeningRoom.branchCode,
                name: screeningRoom.name,
                alternateName: screeningRoom.alternateName,
                address: screeningRoom.address
            },
            superEvent: screeningEventSeries,
            name: screeningEventSeries.name,
            eventStatus: chevre.factory.eventStatusType.EventScheduled,
            offers: offers,
            checkInCount: undefined,
            attendeeCount: undefined
        };
    });
}
/**
 * リクエストボディからイベントオブジェクトを作成する
 */
// tslint:disable-next-line:max-func-body-length
function createMultipleEventFromBody(body, user) {
    return __awaiter(this, void 0, void 0, function* () {
        const eventService = new chevre.service.Event({
            endpoint: process.env.API_ENDPOINT,
            auth: user.authClient
        });
        const placeService = new chevre.service.Place({
            endpoint: process.env.API_ENDPOINT,
            auth: user.authClient
        });
        const ticketTypeService = new chevre.service.TicketType({
            endpoint: process.env.API_ENDPOINT,
            auth: user.authClient
        });
        const boxOfficeTypeService = new chevre.service.BoxOfficeType({
            endpoint: process.env.API_ENDPOINT,
            auth: user.authClient
        });
        const screeningEventSeries = yield eventService.findScreeningEventSeriesById({
            id: body.screeningEventId
        });
        const movieTheater = yield placeService.findMovieTheaterByBranchCode({ branchCode: body.theater });
        const screeningRoom = movieTheater.containsPlace.find((p) => p.branchCode === body.screen);
        if (screeningRoom === undefined) {
            throw new Error('上映スクリーンが見つかりません');
        }
        if (screeningRoom.name === undefined) {
            throw new Error('上映スクリーン名が見つかりません');
        }
        const startDate = moment(`${body.startDate}T00:00:00+09:00`, 'YYYYMMDDTHHmmZ').tz('Asia/Tokyo');
        const toDate = moment(`${body.toDate}T00:00:00+09:00`, 'YYYYMMDDTHHmmZ').tz('Asia/Tokyo');
        const weekDays = body.weekDayData;
        const ticketTypeIds = body.ticketData;
        const mvtkExcludeFlgs = body.mvtkExcludeFlgData;
        const timeData = body.timeData;
        const searchTicketTypeGroupsResult = yield ticketTypeService.searchTicketTypeGroups({ limit: 100 });
        const ticketTypeGroups = searchTicketTypeGroupsResult.data;
        const searchBoxOfficeTypeGroupsResult = yield boxOfficeTypeService.searchBoxOfficeType({ limit: 100 });
        const boxOfficeTypes = searchBoxOfficeTypeGroupsResult.data;
        const attributes = [];
        for (let date = startDate; date <= toDate; date = date.add(1, 'day')) {
            const formattedDate = date.format('YYYY/MM/DD');
            const day = date.get('day').toString();
            if (weekDays.indexOf(day) >= 0) {
                timeData.forEach((data, i) => {
                    const offersValidAfterStart = (body.endSaleTimeAfterScreening !== undefined && body.endSaleTimeAfterScreening !== '')
                        ? Number(body.endSaleTimeAfterScreening)
                        : DEFAULT_OFFERS_VALID_AFTER_START_IN_MINUTES;
                    const eventStartDate = moment(`${formattedDate}T${data.startTime}+09:00`, 'YYYYMMDDTHHmmZ').toDate();
                    const salesStartDate = moment(`${formattedDate}T0000+09:00`, 'YYYYMMDDTHHmmZ')
                        .add(parseInt(body.saleStartDays, 10) * -1, 'day').toDate();
                    const salesEndDate = moment(eventStartDate).add(offersValidAfterStart, 'minutes').toDate();
                    const onlineDisplayStartDate = moment(`${body.onlineDisplayStartDate}T00:00:00+09:00`, 'YYYYMMDDTHH:mm:ssZ').toDate();
                    let acceptedPaymentMethod;
                    // ムビチケ除外の場合は対応決済方法を追加
                    if (mvtkExcludeFlgs[i] === '1') {
                        Object.keys(chevre.factory.paymentMethodType).forEach((key) => {
                            if (acceptedPaymentMethod === undefined) {
                                acceptedPaymentMethod = [];
                            }
                            const paymentMethodType = chevre.factory.paymentMethodType[key];
                            if (paymentMethodType !== chevre.factory.paymentMethodType.MovieTicket) {
                                acceptedPaymentMethod.push(paymentMethodType);
                            }
                        });
                    }
                    const ticketTypeGroup = ticketTypeGroups.find((t) => t.id === ticketTypeIds[i]);
                    if (ticketTypeGroup === undefined) {
                        throw new Error('Ticket Type Group');
                    }
                    const boxOfficeType = boxOfficeTypes.find((t) => t.id === ticketTypeGroup.boxOfficeType.id);
                    if (boxOfficeType === undefined) {
                        throw new Error('Box Office Type');
                    }
                    const offers = {
                        typeOf: 'Offer',
                        priceCurrency: chevre.factory.priceCurrency.JPY,
                        availabilityEnds: salesEndDate,
                        availabilityStarts: onlineDisplayStartDate,
                        category: {
                            id: ticketTypeGroup.id,
                            name: ticketTypeGroup.name
                        },
                        eligibleQuantity: {
                            typeOf: 'QuantitativeValue',
                            unitCode: chevre.factory.unitCode.C62,
                            maxValue: Number(body.maxSeatNumber),
                            value: 1
                        },
                        itemOffered: {
                            serviceType: {
                                typeOf: 'ServiceType',
                                id: boxOfficeType.id,
                                name: boxOfficeType.name
                            }
                        },
                        validFrom: salesStartDate,
                        validThrough: salesEndDate,
                        acceptedPaymentMethod: acceptedPaymentMethod
                    };
                    attributes.push({
                        typeOf: chevre.factory.eventType.ScreeningEvent,
                        doorTime: moment(`${formattedDate}T${data.doorTime}+09:00`, 'YYYYMMDDTHHmmZ').toDate(),
                        startDate: eventStartDate,
                        endDate: moment(`${formattedDate}T${data.endTime}+09:00`, 'YYYYMMDDTHHmmZ').toDate(),
                        workPerformed: screeningEventSeries.workPerformed,
                        location: {
                            typeOf: screeningRoom.typeOf,
                            branchCode: screeningRoom.branchCode,
                            name: screeningRoom.name === undefined ? { en: '', ja: '', kr: '' } : screeningRoom.name,
                            alternateName: screeningRoom.alternateName,
                            address: screeningRoom.address
                        },
                        superEvent: screeningEventSeries,
                        name: screeningEventSeries.name,
                        eventStatus: chevre.factory.eventStatusType.EventScheduled,
                        offers: offers,
                        checkInCount: undefined,
                        attendeeCount: undefined
                    });
                });
            }
        }
        return attributes;
    });
}
/**
 * 新規登録バリデーション
 */
function addValidation(req) {
    req.checkBody('screeningEventId', '上映イベントシリーズが未選択です').notEmpty();
    req.checkBody('startDate', '上映日が未選択です').notEmpty();
    req.checkBody('toDate', '上映日が未選択です').notEmpty();
    req.checkBody('weekDayData', '曜日が未選択です').notEmpty();
    req.checkBody('screen', 'スクリーンが未選択です').notEmpty();
    req.checkBody('theater', '劇場が未選択です').notEmpty();
    req.checkBody('timeData', '時間情報が未選択です').notEmpty();
    req.checkBody('ticketData', '券種グループが未選択です').notEmpty();
}
/**
 * 編集バリデーション
 */
function updateValidation(req) {
    req.checkBody('screeningEventId', '上映イベントシリーズが未選択です').notEmpty();
    req.checkBody('day', '上映日が未選択です').notEmpty();
    req.checkBody('doorTime', '開場時間が未選択です').notEmpty();
    req.checkBody('startTime', '開始時間が未選択です').notEmpty();
    req.checkBody('endTime', '終了時間が未選択です').notEmpty();
    req.checkBody('screen', 'スクリーンが未選択です').notEmpty();
    req.checkBody('ticketTypeGroup', '券種グループが未選択です').notEmpty();
}
