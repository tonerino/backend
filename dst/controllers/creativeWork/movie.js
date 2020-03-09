"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 映画作品コントローラー
 */
const chevre = require("@chevre/api-nodejs-client");
const createDebug = require("debug");
const moment = require("moment-timezone");
const _ = require("underscore");
const Message = require("../../common/Const/Message");
const debug = createDebug('chevre-backend:controllers');
// 作品コード 半角64
const NAME_MAX_LENGTH_CODE = 64;
// 作品名・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA = 64;
// 作品名・英語 半角128
// const NAME_MAX_LENGTH_NAME_EN: number = 128;
// 上映時間・数字10
const NAME_MAX_LENGTH_NAME_MINUTES = 10;
/**
 * 新規登録
 */
function add(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let message = '';
        let errors = {};
        if (req.method === 'POST') {
            // バリデーション
            validate(req, 'add');
            const validatorResult = yield req.getValidationResult();
            errors = req.validationErrors(true);
            if (validatorResult.isEmpty()) {
                try {
                    req.body.id = '';
                    let movie = yield createMovieFromBody(req);
                    const creativeWorkService = new chevre.service.CreativeWork({
                        endpoint: process.env.API_ENDPOINT,
                        auth: req.user.authClient
                    });
                    const { data } = yield creativeWorkService.searchMovies({
                        project: { ids: [req.project.id] },
                        identifier: `^${movie.identifier}$`
                    });
                    if (data.length > 0) {
                        throw new Error('既に存在する作品コードです');
                    }
                    debug('saving an movie...', movie);
                    movie = yield creativeWorkService.createMovie(movie);
                    req.flash('message', '登録しました');
                    res.redirect(`/creativeWorks/movie/${movie.id}/update`);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        // 配給
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchDistributionResult = yield categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.DistributorType } }
        });
        const forms = req.body;
        // 作品マスタ画面遷移
        res.render('creativeWorks/movie/add', {
            message: message,
            errors: errors,
            forms: forms,
            distributions: searchDistributionResult.data
        });
    });
}
exports.add = add;
/**
 * 編集
 */
function update(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const creativeWorkService = new chevre.service.CreativeWork({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            let message = '';
            let errors = {};
            let movie = yield creativeWorkService.findMovieById({
                id: req.params.id
            });
            if (req.method === 'POST') {
                // バリデーション
                validate(req, 'update');
                const validatorResult = yield req.getValidationResult();
                errors = req.validationErrors(true);
                if (validatorResult.isEmpty()) {
                    // 作品DB登録
                    try {
                        req.body.id = req.params.id;
                        movie = yield createMovieFromBody(req);
                        debug('saving an movie...', movie);
                        yield creativeWorkService.updateMovie(movie);
                        req.flash('message', '更新しました');
                        res.redirect(req.originalUrl);
                        return;
                    }
                    catch (error) {
                        message = error.message;
                    }
                }
            }
            // 配給
            const categoryCodeService = new chevre.service.CategoryCode({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const { data } = yield categoryCodeService.search({
                limit: 100,
                project: { id: { $eq: req.project.id } },
                inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.DistributorType } }
            });
            const forms = Object.assign(Object.assign(Object.assign(Object.assign({}, movie), { distribution: (movie.distributor !== undefined && movie.distributor !== null)
                    ? movie.distributor.codeValue
                    : '' }), req.body), { duration: (_.isEmpty(req.body.duration))
                    ? (typeof movie.duration === 'string') ? moment.duration(movie.duration).asMinutes() : ''
                    : req.body.duration, datePublished: (_.isEmpty(req.body.datePublished)) ?
                    (movie.datePublished !== undefined) ? moment(movie.datePublished).tz('Asia/Tokyo').format('YYYY/MM/DD') : '' :
                    req.body.datePublished, offers: (_.isEmpty(req.body.offers)) ?
                    (movie.offers !== undefined && movie.offers.availabilityEnds !== undefined)
                        ? {
                            availabilityEnds: moment(movie.offers.availabilityEnds).add(-1, 'day').tz('Asia/Tokyo').format('YYYY/MM/DD')
                        }
                        : undefined
                    : req.body.offers });
            // 作品マスタ画面遷移
            debug('errors:', errors);
            res.render('creativeWorks/movie/edit', {
                message: message,
                errors: errors,
                forms: forms,
                distributions: data
            });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.update = update;
function createMovieFromBody(req) {
    return __awaiter(this, void 0, void 0, function* () {
        const body = req.body;
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        let distributor;
        const distributorCodeParam = body.distribution;
        if (typeof distributorCodeParam === 'string' && distributorCodeParam.length > 0) {
            const searchDistributorTypesResult = yield categoryCodeService.search({
                limit: 1,
                project: { id: { $eq: req.project.id } },
                inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.DistributorType } },
                codeValue: { $eq: distributorCodeParam }
            });
            const distributorType = searchDistributorTypesResult.data.shift();
            if (distributorType === undefined) {
                throw new Error('配給区分が見つかりません');
            }
            distributor = Object.assign({ id: distributorType.id, distributorType: distributorType.codeValue }, {
                codeValue: distributorType.codeValue
            });
        }
        const movie = Object.assign({ id: body.id, project: req.project, typeOf: chevre.factory.creativeWorkType.Movie, identifier: body.identifier, name: body.name, duration: (body.duration !== '') ? moment.duration(Number(body.duration), 'm').toISOString() : undefined, contentRating: (body.contentRating !== '') ? body.contentRating : null, headline: body.headline, datePublished: (!_.isEmpty(body.datePublished)) ?
                moment(`${body.datePublished}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').toDate() : undefined, offers: {
                project: { typeOf: req.project.typeOf, id: req.project.id },
                typeOf: chevre.factory.offerType.Offer,
                priceCurrency: chevre.factory.priceCurrency.JPY,
                availabilityEnds: (!_.isEmpty(body.offers) && !_.isEmpty(body.offers.availabilityEnds)) ?
                    moment(`${body.offers.availabilityEnds}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').add(1, 'day').toDate() : undefined
            } }, (distributor !== undefined) ? { distributor } : undefined);
        if (movie.offers !== undefined
            && movie.offers.availabilityEnds !== undefined
            && movie.datePublished !== undefined
            && movie.offers.availabilityEnds <= movie.datePublished) {
            throw new Error('興行終了予定日が公開日よりも前です');
        }
        return movie;
    });
}
/**
 * 一覧データ取得API
 */
function getList(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const creativeWorkService = new chevre.service.CreativeWork({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const limit = Number(req.query.limit);
            const page = Number(req.query.page);
            const { data } = yield creativeWorkService.searchMovies({
                limit: limit,
                page: page,
                project: { ids: [req.project.id] },
                identifier: req.query.identifier,
                name: req.query.name,
                datePublishedFrom: (!_.isEmpty(req.query.datePublishedFrom)) ?
                    moment(`${req.query.datePublishedFrom}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').toDate() : undefined,
                datePublishedThrough: (!_.isEmpty(req.query.datePublishedThrough)) ?
                    moment(`${req.query.datePublishedThrough}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').toDate() : undefined
            });
            res.json({
                success: true,
                count: (data.length === Number(limit))
                    ? (Number(page) * Number(limit)) + 1
                    : ((Number(page) - 1) * Number(limit)) + Number(data.length),
                results: data.map((d) => {
                    return Object.assign(Object.assign({}, d), { distributorType: (d.distributor !== undefined && d.distributor !== null)
                            ? d.distributor.codeValue
                            : '' });
                })
            });
        }
        catch (error) {
            res.json({
                success: false,
                count: 0,
                results: []
            });
        }
    });
}
exports.getList = getList;
/**
 * 一覧
 */
function index(__, res) {
    return __awaiter(this, void 0, void 0, function* () {
        res.render('creativeWorks/movie/index', {});
    });
}
exports.index = index;
/**
 * 作品マスタ新規登録画面検証
 */
function validate(req, checkType) {
    let colName = '';
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
