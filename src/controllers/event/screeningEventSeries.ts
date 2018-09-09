/**
 * 上映イベントシリーズコントローラー
 */
import * as chevre from '@toei-jp/chevre-api-nodejs-client';
import * as createDebug from 'debug';
import { Request, Response } from 'express';
import * as moment from 'moment-timezone';
import * as _ from 'underscore';

import * as Message from '../../common/Const/Message';

const debug = createDebug('chevre-backend:controllers');

// 1ページに表示するデータ数
// const DEFAULT_LINES: number = 10;
// 作品コード 半角64
const NAME_MAX_LENGTH_CODE: number = 64;
// 作品名・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA: number = 64;
// 作品名・英語 半角128
const NAME_MAX_LENGTH_NAME_EN: number = 128;

/**
 * 新規登録
 */
export async function add(req: Request, res: Response): Promise<void> {
    const creativeWorkService = new chevre.service.CreativeWork({
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
    const searchMoviesResult = await creativeWorkService.searchMovies({});
    const movies = searchMoviesResult.data;
    const searchMovieTheatersResult = await placeService.searchMovieTheaters({});
    let message = '';
    let errors: any = {};
    if (req.method === 'POST') {
        // バリデーション
        validate(req);
        const validatorResult = await req.getValidationResult();
        errors = req.validationErrors(true);
        if (validatorResult.isEmpty()) {
            // 作品DB登録
            try {
                const movie = await creativeWorkService.findMovieByIdentifier({ identifier: req.body.movieIdentifier });
                const movieTheater = await placeService.findMovieTheaterByBranchCode({ branchCode: req.body.locationBranchCode });
                const attributes = createEventFromBody(req.body, movie, movieTheater);
                debug('saving an event...', attributes);
                const event = await eventService.createScreeningEventSeries(attributes);
                res.redirect(`/events/screeningEventSeries/${event.id}/update`);

                return;
            } catch (error) {
                message = error.message;
            }
        }
    }

    const forms = req.body;

    // 作品マスタ画面遷移
    debug('errors:', errors);
    res.render('events/screeningEventSeries/add', {
        message: message,
        errors: errors,
        forms: forms,
        movies: movies,
        movieTheaters: searchMovieTheatersResult.data
    });
}
/**
 * 編集
 */
export async function update(req: Request, res: Response): Promise<void> {
    const creativeWorkService = new chevre.service.CreativeWork({
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
    const searchMoviesResult = await creativeWorkService.searchMovies({});
    const searchMovieTheatersResult = await placeService.searchMovieTheaters({});
    let message = '';
    let errors: any = {};
    const eventId = req.params.eventId;
    const event = await eventService.findScreeningEventSeriesById({
        id: eventId
    });

    if (req.method === 'POST') {
        // バリデーション
        validate(req);
        const validatorResult = await req.getValidationResult();
        errors = req.validationErrors(true);
        if (validatorResult.isEmpty()) {
            // 作品DB登録
            try {
                const movie = await creativeWorkService.findMovieByIdentifier({ identifier: req.body.movieIdentifier });
                const movieTheater = await placeService.findMovieTheaterByBranchCode({ branchCode: req.body.locationBranchCode });
                const attributes = createEventFromBody(req.body, movie, movieTheater);
                debug('saving an event...', attributes);
                await eventService.updateScreeningEventSeries({
                    id: eventId,
                    attributes: attributes
                });
                res.redirect(req.originalUrl);

                return;
            } catch (error) {
                message = error.message;
            }
        }
    }
    const forms = {
        movieIdentifier: (_.isEmpty(req.body.movieIdentifier)) ? event.workPerformed.identifier : req.body.movieIdentifier,
        nameJa: (_.isEmpty(req.body.nameJa)) ? event.name.ja : req.body.nameJa,
        nameEn: (_.isEmpty(req.body.nameEn)) ? event.name.en : req.body.nameEn,
        kanaName: (_.isEmpty(req.body.kanaName)) ? event.kanaName : req.body.kanaName,
        duration: (_.isEmpty(req.body.duration)) ? moment.duration(event.duration).asMinutes() : req.body.duration,
        locationBranchCode: event.location.branchCode,
        contentRating: event.workPerformed.contentRating,
        subtitleLanguage: event.subtitleLanguage,
        videoFormat: event.videoFormat,
        startDate: (_.isEmpty(req.body.startDate)) ?
            (event.startDate !== null) ? moment(event.startDate).tz('Asia/Tokyo').format('YYYY/MM/DD') : '' :
            req.body.startDate,
        endDate: (_.isEmpty(req.body.endDate)) ?
            (event.endDate !== null) ? moment(event.endDate).tz('Asia/Tokyo').format('YYYY/MM/DD') : '' :
            req.body.endDate
    };
    // 作品マスタ画面遷移
    debug('errors:', errors);
    res.render('events/screeningEventSeries/edit', {
        message: message,
        errors: errors,
        forms: forms,
        movies: searchMoviesResult.data,
        movieTheaters: searchMovieTheatersResult.data
    });
}

/**
 * リクエストボディからイベントオブジェクトを作成する
 */
function createEventFromBody(
    body: any,
    movie: chevre.factory.creativeWork.movie.ICreativeWork,
    movieTheater: chevre.factory.place.movieTheater.IPlace
): chevre.factory.event.screeningEventSeries.IAttributes {
    return {
        typeOf: chevre.factory.eventType.ScreeningEventSeries,
        name: {
            ja: body.nameJa,
            en: body.nameEn
        },
        kanaName: body.kanaName,
        alternativeHeadline: body.nameJa,
        location: {
            id: movieTheater.id,
            typeOf: movieTheater.typeOf,
            branchCode: movieTheater.branchCode,
            name: movieTheater.name,
            kanaName: movieTheater.kanaName
        },
        // organizer: {
        //     typeOf: OrganizationType.MovieTheater,
        //     identifier: params.movieTheater.identifier,
        //     name: params.movieTheater.name
        // },
        videoFormat: body.videoFormat,
        subtitleLanguage: body.subtitleLanguage,
        workPerformed: movie,
        duration: movie.duration,
        startDate: (!_.isEmpty(body.startDate)) ? moment(`${body.startDate}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').toDate() : undefined,
        endDate: (!_.isEmpty(body.endDate)) ? moment(`${body.endDate}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').toDate() : undefined,
        eventStatus: chevre.factory.eventStatusType.EventScheduled
    };
}
/**
 * 一覧データ取得API
 */
export async function getList(req: Request, res: Response): Promise<void> {
    try {
        const eventService = new chevre.service.Event({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const { totalCount, data } = await eventService.searchScreeningEventSeries({
            limit: req.query.limit,
            page: req.query.page,
            name: req.query.name,
            location: {
                branchCodes: (req.query.locationBranchCode !== '') ? [req.query.locationBranchCode] : undefined
            },
            workPerformed: {
                identifiers: (req.query.movieIdentifier !== '') ? [req.query.movieIdentifier] : undefined
            }
        });
        const results = data.map((event) => {
            return {
                id: event.id,
                movieIdentifier: event.workPerformed.identifier,
                filmNameJa: event.name.ja,
                filmNameEn: event.name.en,
                kanaName: event.kanaName,
                duration: moment.duration(event.duration).humanize(),
                contentRating: event.workPerformed.contentRating,
                subtitleLanguage: event.subtitleLanguage,
                videoFormat: event.videoFormat
            };
        });
        res.json({
            success: true,
            count: totalCount,
            results: results
        });
    } catch (error) {
        res.json({
            success: false,
            count: 0,
            results: []
        });
    }
}
/**
 * 一覧
 */
export async function index(req: Request, res: Response): Promise<void> {
    const placeService = new chevre.service.Place({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const searchMovieTheatersResult = await placeService.searchMovieTheaters({});
    res.render('events/screeningEventSeries/index', {
        filmModel: {},
        movieTheaters: searchMovieTheatersResult.data
    });
}
/**
 * 作品マスタ新規登録画面検証
 */
function validate(req: Request): void {
    let colName: string = '';
    // 作品コード
    colName = '作品コード';
    req.checkBody('movieIdentifier', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('movieIdentifier', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_CODE });
    //.regex(/^[ -\~]+$/, req.__('Message.invalid{{fieldName}}', { fieldName: '%s' })),
    // 作品名
    colName = '作品名';
    req.checkBody('nameJa', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('nameJa', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_NAME_JA });
    // 作品名カナ
    colName = '作品名カナ';
    req.checkBody('kanaName', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('kanaName', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA)).len({ max: NAME_MAX_LENGTH_NAME_JA });
    // .regex(/^[ァ-ロワヲンーa-zA-Z]*$/, req.__('Message.invalid{{fieldName}}', { fieldName: '%s' })),
    // 作品名英
    colName = '作品名英';
    req.checkBody('nameEn', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('nameEn', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_EN)).len({ max: NAME_MAX_LENGTH_NAME_EN });
    // 上映開始日
    colName = '上映開始日';
    if (!_.isEmpty(req.body.startDate)) {
        req.checkBody('startDate', Message.Common.invalidDateFormat.replace('$fieldName$', colName)).isDate();
    }
    // 上映終了日
    colName = '上映終了日';
    if (!_.isEmpty(req.body.endDate)) {
        req.checkBody('endDate', Message.Common.invalidDateFormat.replace('$fieldName$', colName)).isDate();
    }
    // レイティング
    colName = 'レイティング';
    req.checkBody('contentRating', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    // 上映形態
    colName = '上映形態';
    req.checkBody('videoFormat', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
}
