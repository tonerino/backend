/**
 * 映画作品コントローラー
 */
import * as chevre from '@chevre/api-nodejs-client';
import * as createDebug from 'debug';
import { NextFunction, Request, Response } from 'express';
import * as moment from 'moment-timezone';
import * as _ from 'underscore';

import * as Message from '../../common/Const/Message';

const debug = createDebug('chevre-backend:controllers');

// 作品コード 半角64
const NAME_MAX_LENGTH_CODE: number = 64;
// 作品名・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA: number = 64;
// 作品名・英語 半角128
// const NAME_MAX_LENGTH_NAME_EN: number = 128;
// 上映時間・数字10
const NAME_MAX_LENGTH_NAME_MINUTES: number = 10;

/**
 * 新規登録
 */
export async function add(req: Request, res: Response): Promise<void> {
    let message = '';
    let errors: any = {};
    if (req.method === 'POST') {
        // バリデーション
        validate(req, 'add');
        const validatorResult = await req.getValidationResult();
        errors = req.validationErrors(true);
        if (validatorResult.isEmpty()) {
            try {
                const movie = createMovieFromBody(req.body);
                const creativeWorkService = new chevre.service.CreativeWork({
                    endpoint: <string>process.env.API_ENDPOINT,
                    auth: req.user.authClient
                });

                const { totalCount } = await creativeWorkService.searchMovies({ identifier: `^${movie.identifier}$` });
                if (totalCount > 0) {
                    throw new Error('既に存在する作品コードです');
                }

                debug('saving an movie...', movie);
                await creativeWorkService.createMovie(movie);
                req.flash('message', '登録しました');
                res.redirect(`/creativeWorks/movie/${movie.identifier}/update`);

                return;
            } catch (error) {
                message = error.message;
            }
        }
    }
    // 配給
    const distributionsService = new chevre.service.Distributions({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const distributions = await distributionsService.getDistributionsList();
    const forms = req.body;
    // 作品マスタ画面遷移
    res.render('creativeWorks/movie/add', {
        message: message,
        errors: errors,
        forms: forms,
        distributions: distributions
    });
}
/**
 * 編集
 */
export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const creativeWorkService = new chevre.service.CreativeWork({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        let message = '';
        let errors: any = {};

        let movie = await creativeWorkService.findMovieByIdentifier({
            // 現時点で半角バリデーションをかけていないので、念のため
            identifier: encodeURIComponent(req.params.identifier)
        });

        if (req.method === 'POST') {
            // バリデーション
            validate(req, 'update');
            const validatorResult = await req.getValidationResult();
            errors = req.validationErrors(true);
            if (validatorResult.isEmpty()) {
                // 作品DB登録
                try {
                    movie = createMovieFromBody(req.body);
                    debug('saving an movie...', movie);
                    await creativeWorkService.updateMovie(movie);
                    req.flash('message', '更新しました');
                    res.redirect(req.originalUrl);

                    return;
                } catch (error) {
                    message = error.message;
                }
            }
        }
        // 配給
        const distributionsService = new chevre.service.Distributions({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const distributions = await distributionsService.getDistributionsList();
        const forms = {
            ...movie,
            distribution: (movie.distributor !== undefined) ? movie.distributor.id : '',
            ...req.body,
            duration: (_.isEmpty(req.body.duration))
                ? (typeof movie.duration === 'string') ? moment.duration(movie.duration).asMinutes() : ''
                : req.body.duration,
            datePublished: (_.isEmpty(req.body.datePublished)) ?
                (movie.datePublished !== undefined) ? moment(movie.datePublished).tz('Asia/Tokyo').format('YYYY/MM/DD') : '' :
                req.body.datePublished,
            offers: (_.isEmpty(req.body.offers)) ?
                (movie.offers !== undefined && movie.offers.availabilityEnds !== undefined)
                    ? {
                        availabilityEnds: moment(movie.offers.availabilityEnds).add(-1, 'day').tz('Asia/Tokyo').format('YYYY/MM/DD')
                    }
                    : undefined
                : req.body.offers
        };
        // 作品マスタ画面遷移
        debug('errors:', errors);
        res.render('creativeWorks/movie/edit', {
            message: message,
            errors: errors,
            forms: forms,
            distributions: distributions
        });
    } catch (error) {
        next(error);
    }
}
function createMovieFromBody(body: any): chevre.factory.creativeWork.movie.ICreativeWork {
    const movie: chevre.factory.creativeWork.movie.ICreativeWork = {
        typeOf: chevre.factory.creativeWorkType.Movie,
        identifier: body.identifier,
        name: body.name,
        duration: (body.duration !== '') ? moment.duration(Number(body.duration), 'm').toISOString() : null,
        contentRating: (body.contentRating !== '') ? body.contentRating : null,
        headline: body.headline,
        datePublished: (!_.isEmpty(body.datePublished)) ?
            moment(`${body.datePublished}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').toDate() : undefined,
        offers: {
            typeOf: 'Offer',
            priceCurrency: chevre.factory.priceCurrency.JPY,
            availabilityEnds: (!_.isEmpty(body.offers) && !_.isEmpty(body.offers.availabilityEnds)) ?
                moment(`${body.offers.availabilityEnds}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').add(1, 'day').toDate() : undefined
        },
        distributor: {
            id: <string>body.distribution,
            name: ''
        }
    };

    if (movie.offers !== undefined
        && movie.offers.availabilityEnds !== undefined
        && movie.datePublished !== undefined
        && movie.offers.availabilityEnds <= movie.datePublished) {
        throw new Error('興行終了予定日が公開日よりも前です');
    }

    return movie;
}
/**
 * 一覧データ取得API
 */
export async function getList(req: Request, res: Response): Promise<void> {
    try {
        const creativeWorkService = new chevre.service.CreativeWork({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const result = await creativeWorkService.searchMovies({
            limit: req.query.limit,
            page: req.query.page,
            identifier: req.query.identifier,
            name: req.query.name,
            datePublishedFrom: (!_.isEmpty(req.query.datePublishedFrom)) ?
                moment(`${req.query.datePublishedFrom}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').toDate() : undefined,
            datePublishedThrough: (!_.isEmpty(req.query.datePublishedThrough)) ?
                moment(`${req.query.datePublishedThrough}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').toDate() : undefined
        });
        res.json({
            success: true,
            count: result.totalCount,
            results: result.data
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
export async function index(__: Request, res: Response): Promise<void> {
    res.render(
        'creativeWorks/movie/index',
        {}
    );
}
/**
 * 作品マスタ新規登録画面検証
 */
function validate(req: Request, checkType: string): void {
    let colName: string = '';
    if (checkType === 'add') {
        colName = '作品コード';
        req.checkBody('identifier', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
        req.checkBody('identifier', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_CODE });
    }
    //.regex(/^[ -\~]+$/, req.__('Message.invalid{{fieldName}}', { fieldName: '%s' })),

    colName = '作品名';
    req.checkBody('name', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('name', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_NAME_JA });

    colName = '上映時間';
    if (req.body.duration !== '') {
        req.checkBody('duration', Message.Common.getMaxLengthHalfByte(colName, NAME_MAX_LENGTH_NAME_MINUTES)).optional()
            .isNumeric().len({ max: NAME_MAX_LENGTH_NAME_MINUTES });
    }

    colName = 'サブタイトル';
    req.checkBody('headline', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_NAME_JA });

    colName = '配給';
    req.checkBody('distribution', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
}
