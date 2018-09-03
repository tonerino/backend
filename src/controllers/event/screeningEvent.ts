/**
 * 上映イベントコントローラー
 */
import * as chevre from '@toei-jp/chevre-api-nodejs-client';
import * as createDebug from 'debug';
import { NextFunction, Request, Response } from 'express';
import * as moment from 'moment';

import User from '../../user';

const debug = createDebug('chevre-backend:controllers');

export async function index(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const placeService = new chevre.service.Place({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchMovieTheatersResult = await placeService.searchMovieTheaters({});
        if (searchMovieTheatersResult.totalCount === 0) {
            throw new Error('劇場が見つかりません');
        }
        res.render('events/screeningEvent/index', {
            movieTheaters: searchMovieTheatersResult.data,
            moment: moment
        });
    } catch (err) {
        next(err);
    }
}
export async function search(req: Request, res: Response): Promise<void> {
    const ticketTypeService = new chevre.service.TicketType({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const eventService = new chevre.service.Event({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const placeService = new chevre.service.Place({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    try {
        const day = req.query.day;
        const movieTheater = await placeService.findMovieTheaterByBranchCode({ branchCode: req.query.theater });
        const searchResult = await eventService.searchScreeningEvents({
            inSessionFrom: moment(`${day}T00:00:00+09:00`, 'YYYYMMDDTHH:mm:ssZ').toDate(),
            inSessionThrough: moment(`${day}T00:00:00+09:00`, 'YYYYMMDDTHH:mm:ssZ').add(1, 'day').toDate(),
            superEvent: {
                locationBranchCodes: [movieTheater.branchCode]
            }
        });
        const searchTicketTypeGroupsResult = await ticketTypeService.searchTicketTypeGroups({});
        res.json({
            validation: null,
            error: null,
            performances: searchResult.data,
            screens: movieTheater.containsPlace,
            ticketGroups: searchTicketTypeGroupsResult.data
        });
    } catch (err) {
        debug('search error', err);
        res.json({
            validation: null,
            error: err.message
        });
    }
}
/**
 * 作品検索
 */
export async function searchScreeningEventSeries(req: Request, res: Response): Promise<void> {
    const eventService = new chevre.service.Event({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    try {
        const searchResult = await eventService.searchScreeningEventSeries({
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
    } catch (err) {
        debug('searchScreeningEvent error', err);
        res.json({
            validation: null,
            error: err.message
        });
    }
}
/**
 * 新規登録
 */
export async function regist(req: Request, res: Response): Promise<void> {
    try {
        const eventService = new chevre.service.Event({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        addValidation(req);
        const validatorResult = await req.getValidationResult();
        const validations = req.validationErrors(true);
        if (!validatorResult.isEmpty()) {
            res.json({
                validation: validations,
                error: null
            });

            return;
        }

        debug('saving screening event...', req.body);
        const attributes = await createEventFromBody(req.body, req.user);
        await eventService.createScreeningEvent(attributes);
        res.json({
            validation: null,
            error: null
        });
    } catch (err) {
        debug('regist error', err);
        res.json({
            validation: null,
            error: err.message
        });
    }
}
/**
 * 更新
 */
export async function update(req: Request, res: Response): Promise<void> {
    try {
        const eventService = new chevre.service.Event({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        updateValidation(req);
        const validatorResult = await req.getValidationResult();
        const validations = req.validationErrors(true);
        if (!validatorResult.isEmpty()) {
            res.json({
                validation: validations,
                error: null
            });

            return;
        }
        debug('saving screening event...', req.body);
        const attributes = await createEventFromBody(req.body, req.user);
        await eventService.updateScreeningEvent({
            id: req.params.eventId,
            attributes: attributes
        });
        res.json({
            validation: null,
            error: null
        });
    } catch (err) {
        debug('update error', err);
        res.json({
            validation: null,
            error: err.message
        });
    }
}
/**
 * リクエストボディからイベントオブジェクトを作成する
 */
async function createEventFromBody(body: any, user: User): Promise<chevre.factory.event.screeningEvent.IAttributes> {
    const eventService = new chevre.service.Event({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: user.authClient
    });
    const placeService = new chevre.service.Place({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: user.authClient
    });
    const screeningEventSeries = await eventService.findScreeningEventSeriesById({
        id: body.screeningEventId
    });
    const movieTheater = await placeService.findMovieTheaterByBranchCode({ branchCode: body.theater });
    const screeningRoom = movieTheater.containsPlace.find((p) => p.branchCode === body.screen);
    if (screeningRoom === undefined) {
        throw new Error('上映スクリーンが見つかりません');
    }
    if (screeningRoom.name === undefined) {
        throw new Error('上映スクリーン名が見つかりません');
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
            branchCode: <string>screeningRoom.branchCode,
            name: screeningRoom.name
        },
        superEvent: screeningEventSeries,
        name: screeningEventSeries.name,
        eventStatus: chevre.factory.eventStatusType.EventScheduled
    };
}
/**
 * 新規登録バリデーション
 */
function addValidation(req: Request): void {
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
function updateValidation(req: Request): void {
    req.checkBody('screeningEventId', '上映イベントシリーズが未選択です').notEmpty();
    req.checkBody('day', '上映日が未選択です').notEmpty();
    req.checkBody('doorTime', '開場時間が未選択です').notEmpty();
    req.checkBody('startTime', '開始時間が未選択です').notEmpty();
    req.checkBody('endTime', '終了時間が未選択です').notEmpty();
    req.checkBody('screen', 'スクリーンが未選択です').notEmpty();
    req.checkBody('ticketTypeGroup', '券種グループが未選択です').notEmpty();
}
