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
const moment = require("moment");
const debug = createDebug('chevre-backend:controllers');
function index(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const placeService = new chevre.service.Place({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const searchMovieTheatersResult = yield placeService.searchMovieTheaters({});
            if (searchMovieTheatersResult.totalCount === 0) {
                throw new Error('劇場が見つかりません');
            }
            res.render('events/screeningEvent/index', {
                movieTheaters: searchMovieTheatersResult.data,
                moment: moment
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
            const day = req.query.day;
            const movieTheater = yield placeService.findMovieTheaterByBranchCode({ branchCode: req.query.theater });
            const searchResult = yield eventService.searchScreeningEvents({
                inSessionFrom: moment(`${day}T00:00:00+09:00`, 'YYYYMMDDTHH:mm:ssZ').toDate(),
                inSessionThrough: moment(`${day}T00:00:00+09:00`, 'YYYYMMDDTHH:mm:ssZ').add(1, 'day').toDate(),
                superEvent: {
                    locationBranchCodes: [movieTheater.branchCode]
                }
            });
            const searchTicketTypeGroupsResult = yield ticketTypeService.searchTicketTypeGroups({});
            res.json({
                validation: null,
                error: null,
                performances: searchResult.data,
                screens: movieTheater.containsPlace,
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
            const attributes = yield createEventFromBody(req.body, req.user);
            yield eventService.createScreeningEvent(attributes);
            res.json({
                validation: null,
                error: null
            });
        }
        catch (err) {
            debug('regist error', err);
            res.json({
                validation: null,
                error: err.message
            });
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
 * リクエストボディからイベントオブジェクトを作成する
 */
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
        //発売開始日
        let releaseTime;
        if (body.releaseDate !== '') {
            releaseTime = moment(`${body.releaseDate}T${body.releaseTime}+09:00`, 'YYYYMMDDTHHmmZ').toDate();
        }
        return {
            typeOf: chevre.factory.eventType.ScreeningEvent,
            doorTime: moment(`${body.day}T${body.doorTime}+09:00`, 'YYYYMMDDTHHmmZ').toDate(),
            startDate: moment(`${body.day}T${body.startTime}+09:00`, 'YYYYMMDDTHHmmZ').toDate(),
            endDate: moment(`${body.day}T${body.endTime}+09:00`, 'YYYYMMDDTHHmmZ').toDate(),
            ticketTypeGroup: body.ticketTypeGroup,
            workPerformed: screeningEventSeries.workPerformed,
            location: {
                typeOf: screeningRoom.typeOf,
                branchCode: screeningRoom.branchCode,
                name: screeningRoom.name
            },
            superEvent: screeningEventSeries,
            name: screeningEventSeries.name,
            eventStatus: chevre.factory.eventStatusType.EventScheduled,
            releaseTime: releaseTime
        };
    });
}
/**
 * 新規登録バリデーション
 */
function addValidation(req) {
    req.checkBody('screeningEventId', '上映イベントシリーズが未選択です').notEmpty();
    req.checkBody('day', '上映日が未選択です').notEmpty();
    req.checkBody('doorTime', '開場時間が未選択です').notEmpty();
    req.checkBody('startTime', '開始時間が未選択です').notEmpty();
    req.checkBody('endTime', '終了時間が未選択です').notEmpty();
    req.checkBody('screen', 'スクリーンが未選択です').notEmpty();
    req.checkBody('ticketTypeGroup', '券種グループが未選択です').notEmpty();
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
//# sourceMappingURL=screeningEvent.js.map