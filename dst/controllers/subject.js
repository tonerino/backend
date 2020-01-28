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
 * 科目コントローラー
 */
const chevre = require("@chevre/api-nodejs-client");
const createDebug = require("debug");
const _ = require("underscore");
const Message = require("../common/Const/Message");
const debug = createDebug('chevre-backend:controllers');
// 作品コード 半角64
const NAME_MAX_LENGTH_CODE = 64;
// 作品名・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA = 64;
// 作品名・英語 半角128
// const NAME_MAX_LENGTH_NAME_EN: number = 128;
// 上映時間・数字10
// const NAME_MAX_LENGTH_NAME_MINUTES: number = 10;
/**
 * 新規登録
 */
function add(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let message = '';
        let errors = {};
        if (req.method === 'POST') {
            // バリデーション
            validate(req);
            const validatorResult = yield req.getValidationResult();
            errors = req.validationErrors(true);
            if (validatorResult.isEmpty()) {
                try {
                    const subjectAttributest = createSubjectFromBody(req);
                    debug('saving an subject...', subjectAttributest);
                    const subjectService = new chevre.service.Subject({
                        endpoint: process.env.API_ENDPOINT,
                        auth: req.user.authClient
                    });
                    yield subjectService.createSubject({
                        attributes: subjectAttributest
                    });
                    req.flash('message', '登録しました');
                    res.redirect(`/subjects/${subjectAttributest.detailCd}/update`);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        const forms = req.body;
        // 科目画面遷移
        res.render('subject/add', {
            message: message,
            errors: errors,
            forms: forms
        });
    });
}
exports.add = add;
/**
 * 編集
 */
function update(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const subjectService = new chevre.service.Subject({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        let message = '';
        let errors = {};
        const { data } = yield subjectService.searchSubject({
            detailCd: req.params.id
        });
        if (data.length === 0) {
            throw new Error('Subject Not Found');
        }
        const subject = data[0];
        if (req.method === 'POST') {
            // バリデーション
            validate(req);
            const validatorResult = yield req.getValidationResult();
            errors = req.validationErrors(true);
            if (validatorResult.isEmpty()) {
                // 作品DB登録
                try {
                    const subjectData = createSubjectFromBody(req);
                    debug('saving an subject...', subjectData);
                    yield subjectService.updateSubject({
                        id: subject.id,
                        attributes: subjectData
                    });
                    req.flash('message', '更新しました');
                    res.redirect(req.originalUrl);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        const forms = {
            subjectClassificationCd: (_.isEmpty(req.body.subjectClassificationCd)) ?
                subject.subjectClassificationCd : req.body.subjectClassificationCd,
            subjectClassificationName: (_.isEmpty(req.body.subjectClassificationName)) ?
                subject.subjectClassificationName : req.body.subjectClassificationName,
            subjectCd: (_.isEmpty(req.body.subjectCd)) ?
                subject.subjectCd : req.body.subjectCd,
            subjectName: (_.isEmpty(req.body.subjectName)) ?
                subject.subjectName : req.body.subjectName,
            detailCd: (_.isEmpty(req.body.detailCd)) ?
                subject.detailCd : req.body.detailCd,
            detailName: (_.isEmpty(req.body.detailName)) ?
                subject.detailName : req.body.detailName
        };
        // 作品マスタ画面遷移
        debug('errors:', errors);
        res.render('subject/edit', {
            message: message,
            errors: errors,
            forms: forms
        });
    });
}
exports.update = update;
function createSubjectFromBody(req) {
    const body = req.body;
    return Object.assign({ project: req.project }, { subjectClassificationCd: body.subjectClassificationCd, subjectClassificationName: body.subjectClassificationName, subjectCd: body.subjectCd, subjectName: body.subjectName, detailCd: body.detailCd, detailName: body.detailName });
}
/**
 * 一覧データ取得API
 */
function getList(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const subjectService = new chevre.service.Subject({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const limit = Number(req.query.limit);
            const page = Number(req.query.page);
            const { data } = yield subjectService.searchSubject({
                limit: limit,
                page: page,
                detailCd: req.query.detailCd
            });
            res.json({
                success: true,
                count: (data.length === Number(limit))
                    ? (Number(page) * Number(limit)) + 1
                    : ((Number(page) - 1) * Number(limit)) + Number(data.length),
                results: data.map((g) => {
                    return {
                        id: g.detailCd,
                        subjectClassificationCd: g.subjectClassificationCd,
                        subjectClassificationName: g.subjectClassificationName,
                        subjectCd: g.subjectCd,
                        subjectName: g.subjectName,
                        detailCd: g.detailCd,
                        detailName: g.detailName
                    };
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
        res.render('subject/index', {});
    });
}
exports.index = index;
/**
 * 科目新規登録画面検証
 */
function validate(req) {
    // 科目分類コード
    let colName = '科目分類コード';
    req.checkBody('subjectClassificationCd', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('subjectClassificationCd', Message.Common.getMaxLengthHalfByte(colName, NAME_MAX_LENGTH_CODE))
        .len({ max: NAME_MAX_LENGTH_CODE });
    // 科目分類名称
    colName = '科目分類名称';
    req.checkBody('subjectClassificationName', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('subjectClassificationName', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA))
        .len({ max: NAME_MAX_LENGTH_NAME_JA });
    // 科目コード
    colName = '科目コード';
    req.checkBody('subjectCd', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('subjectCd', Message.Common.getMaxLengthHalfByte(colName, NAME_MAX_LENGTH_CODE))
        .len({ max: NAME_MAX_LENGTH_CODE });
    // 科目名称
    colName = '科目名称';
    req.checkBody('subjectName', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('subjectName', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA))
        .len({ max: NAME_MAX_LENGTH_NAME_JA });
    // 細目コード
    colName = '細目コード';
    req.checkBody('detailCd', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('detailCd', Message.Common.getMaxLengthHalfByte(colName, NAME_MAX_LENGTH_CODE))
        .len({ max: NAME_MAX_LENGTH_CODE });
    // 細目名称
    colName = '細目名称';
    req.checkBody('detailName', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('detailName', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA))
        .len({ max: NAME_MAX_LENGTH_NAME_JA });
}
