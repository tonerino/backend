/**
 * 映画作品コントローラー
 */
import * as chevre from '@toei-jp/chevre-api-nodejs-client';
import * as createDebug from 'debug';
import { Request, Response } from 'express';
import * as moment from 'moment-timezone';
import * as _ from 'underscore';

import * as Message from '../../common/Const/Message';

const debug = createDebug('chevre-backend:controllers');

// 作品コード 半角64
const NAME_MAX_LENGTH_CODE: number = 64;
// 作品名・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA: number = 64;
// 作品名・英語 半角128
const NAME_MAX_LENGTH_NAME_EN: number = 128;
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
                debug('saving an movie...', movie);
                const creativeWorkService = new chevre.service.CreativeWork({
                    endpoint: <string>process.env.API_ENDPOINT,
                    auth: req.user.authClient
                });
                await creativeWorkService.createMovie(movie);
                res.redirect(`/creativeWorks/movie/${movie.identifier}/update`);

                return;
            } catch (error) {
                message = error.message;
            }
        }
    }
    const forms = req.body;
    // 作品マスタ画面遷移
    res.render('creativeWorks/movie/add', {
        message: message,
        errors: errors,
        forms: forms
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
    let message = '';
    let errors: any = {};
    let movie = await creativeWorkService.findMovieByIdentifier({
        identifier: req.params.identifier
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
                await creativeWorkService.createMovie(movie);
                res.redirect(req.originalUrl);

                return;
            } catch (error) {
                message = error.message;
            }
        }
    }
    const forms = {
        identifier: (_.isEmpty(req.body.identifier)) ? movie.identifier : req.body.identifier,
        name: (_.isEmpty(req.body.nameJa)) ? movie.name : req.body.name,
        duration: (_.isEmpty(req.body.duration)) ? moment.duration(movie.duration).asMinutes() : req.body.duration,
        contentRating: movie.contentRating
    };
    // 作品マスタ画面遷移
    debug('errors:', errors);
    res.render('creativeWorks/movie/edit', {
        message: message,
        errors: errors,
        forms: forms
    });
}
function createMovieFromBody(body: any): chevre.factory.creativeWork.movie.ICreativeWork {
    return {
        typeOf: chevre.factory.creativeWorkType.Movie,
        identifier: body.identifier,
        name: body.name,
        duration: moment.duration(Number(body.duration), 'm').toISOString(),
        contentRating: body.contentRating
    };
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
            name: req.query.name
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
    res.render('creativeWorks/movie/index', {
        filmModel: {}
    });
}
/**
 * 作品マスタ新規登録画面検証
 */
function validate(req: Request, checkType: string): void {
    let colName: string = '';
    // 作品コード
    if (checkType === 'add') {
        colName = '作品コード';
        req.checkBody('identifier', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
        req.checkBody('identifier', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_CODE });
    }
    //.regex(/^[ -\~]+$/, req.__('Message.invalid{{fieldName}}', { fieldName: '%s' })),
    // 作品名
    colName = '作品名';
    req.checkBody('name', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('name', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_NAME_JA });
    // 上映時間
    colName = '上映時間';
    req.checkBody('duration', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_MINUTES))
        .len({ max: NAME_MAX_LENGTH_NAME_EN });
    // レイティング
    colName = 'レイティング';
    req.checkBody('contentRating', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
}
