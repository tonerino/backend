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
 * 勘定科目コントローラー
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
                    const accountTitleService = new chevre.service.AccountTitle({
                        endpoint: process.env.API_ENDPOINT,
                        auth: req.user.authClient
                    });
                    yield accountTitleService.create(subjectAttributest);
                    req.flash('message', '登録しました');
                    res.redirect(`/subjects/${subjectAttributest.codeValue}/update`);
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
    var _a, _b, _c, _d, _e, _f;
    return __awaiter(this, void 0, void 0, function* () {
        const accountTitleService = new chevre.service.AccountTitle({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        let message = '';
        let errors = {};
        const { data } = yield accountTitleService.search({
            project: { ids: [req.project.id] },
            codeValue: { $eq: req.params.id }
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
                    yield accountTitleService.update(subjectData);
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
            subjectClassificationCd: (_.isEmpty(req.body.subjectClassificationCd)) ? (_b = (_a = subject.inCodeSet) === null || _a === void 0 ? void 0 : _a.inCodeSet) === null || _b === void 0 ? void 0 : _b.codeValue : req.body.subjectClassificationCd,
            subjectClassificationName: (_.isEmpty(req.body.subjectClassificationName)) ? (_d = (_c = subject.inCodeSet) === null || _c === void 0 ? void 0 : _c.inCodeSet) === null || _d === void 0 ? void 0 : _d.name : req.body.subjectClassificationName,
            subjectCd: (_.isEmpty(req.body.subjectCd)) ? (_e = subject.inCodeSet) === null || _e === void 0 ? void 0 : _e.codeValue : req.body.subjectCd,
            subjectName: (_.isEmpty(req.body.subjectName)) ? (_f = subject.inCodeSet) === null || _f === void 0 ? void 0 : _f.name : req.body.subjectName,
            detailCd: (_.isEmpty(req.body.detailCd)) ?
                subject.codeValue : req.body.detailCd,
            detailName: (_.isEmpty(req.body.detailName)) ?
                subject.name : req.body.detailName
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
    return {
        project: req.project,
        typeOf: 'AccountTitle',
        codeValue: body.detailCd,
        name: body.detailName,
        inCodeSet: {
            project: req.project,
            typeOf: 'AccountTitle',
            codeValue: body.subjectCd,
            inCodeSet: {
                project: req.project,
                typeOf: 'AccountTitle',
                codeValue: body.subjectClassificationCd
            }
        }
    };
}
/**
 * 一覧データ取得API
 */
function getList(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const accountTitleService = new chevre.service.AccountTitle({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const limit = Number(req.query.limit);
            const page = Number(req.query.page);
            const { data } = yield accountTitleService.search({
                limit: limit,
                page: page,
                project: { ids: [req.project.id] },
                codeValue: (req.query.detailCd !== undefined && req.query.detailCd !== '')
                    ? req.query.detailCd
                    : undefined
            });
            res.json({
                success: true,
                count: (data.length === Number(limit))
                    ? (Number(page) * Number(limit)) + 1
                    : ((Number(page) - 1) * Number(limit)) + Number(data.length),
                results: data.map((g) => {
                    var _a, _b, _c, _d, _e, _f;
                    return {
                        id: g.codeValue,
                        subjectClassificationCd: (_b = (_a = g.inCodeSet) === null || _a === void 0 ? void 0 : _a.inCodeSet) === null || _b === void 0 ? void 0 : _b.codeValue,
                        subjectClassificationName: (_d = (_c = g.inCodeSet) === null || _c === void 0 ? void 0 : _c.inCodeSet) === null || _d === void 0 ? void 0 : _d.name,
                        subjectCd: (_e = g.inCodeSet) === null || _e === void 0 ? void 0 : _e.codeValue,
                        subjectName: (_f = g.inCodeSet) === null || _f === void 0 ? void 0 : _f.name,
                        detailCd: g.codeValue,
                        detailName: g.name
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
