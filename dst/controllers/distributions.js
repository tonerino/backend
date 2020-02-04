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
 * 配給マスタコントローラー
 */
const chevre = require("@chevre/api-nodejs-client");
const createDebug = require("debug");
const http_status_1 = require("http-status");
const Message = require("../common/Const/Message");
const debug = createDebug('chevre-backend:controllers');
const MAX_LENGTH = 64;
/**
 * 新規登録
 */
function add(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        let message = '';
        let errors = {};
        if (req.method === 'POST') {
            // 検証
            validateForm(req);
            const validatorResult = yield req.getValidationResult();
            errors = req.validationErrors(true);
            // 検証
            if (validatorResult.isEmpty()) {
                // 配給DB登録プロセス
                try {
                    const distribution = {
                        project: { typeOf: 'Project', id: req.project.id },
                        typeOf: 'CategoryCode',
                        id: '',
                        codeValue: req.body.codeVale,
                        inCodeSet: {
                            typeOf: 'CategoryCodeSet',
                            identifier: chevre.factory.categoryCode.CategorySetIdentifier.DistributorType
                        },
                        name: req.body.name
                    };
                    const { data } = yield categoryCodeService.search({
                        project: { id: { $eq: req.project.id } },
                        inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.DistributorType } },
                        codeValue: {
                            $eq: req.body.id
                        }
                    });
                    if (data.length > 0) {
                        message = '配給コードが既に登録されています。';
                    }
                    else {
                        yield categoryCodeService.create(distribution);
                        req.flash('message', '登録しました');
                        res.redirect('/distributions');
                        return;
                    }
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        const forms = Object.assign({}, req.body);
        res.render('distributions/add', {
            message: message,
            errors: errors,
            forms: forms
        });
    });
}
exports.add = add;
/**
 * 一覧データ取得API
 */
function getList(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const categoryCodeService = new chevre.service.CategoryCode({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const limit = Number(req.query.limit);
            const page = Number(req.query.page);
            const { data } = yield categoryCodeService.search({
                limit: limit,
                page: page,
                project: { id: { $eq: req.project.id } },
                inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.DistributorType } },
                codeValue: { $eq: (typeof req.query.id === 'string' && req.query.id.length > 0) ? req.query.id : undefined },
                name: {
                    $regex: (typeof req.query.name === 'string' && req.query.name.length > 0) ? req.query.name : undefined
                }
            });
            res.json({
                success: true,
                count: (data.length === Number(limit))
                    ? (Number(page) * Number(limit)) + 1
                    : ((Number(page) - 1) * Number(limit)) + Number(data.length),
                results: data
            });
        }
        catch (err) {
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
        // 配給マスタ画面遷移
        res.render('distributions/index', {
            message: ''
        });
    });
}
exports.index = index;
/**
 * 編集
 */
function update(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        // 検証
        validateForm(req, false);
        const validatorResult = yield req.getValidationResult();
        const validations = req.validationErrors(true);
        if (!validatorResult.isEmpty()) {
            res.json({
                validation: validations,
                error: null
            });
            return;
        }
        // 配給DB更新プロセス
        try {
            const distribution = {
                project: { typeOf: 'Project', id: req.project.id },
                typeOf: 'CategoryCode',
                id: req.params.id,
                codeValue: req.body.codeValue,
                inCodeSet: {
                    typeOf: 'CategoryCodeSet',
                    identifier: chevre.factory.categoryCode.CategorySetIdentifier.DistributorType
                },
                name: req.body.name
                // id: req.params.id,
                // name: req.body.name
            };
            yield categoryCodeService.update(distribution);
            res.status(http_status_1.NO_CONTENT).end();
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
 * 配給マスタ新規登録画面検証
 */
function validateForm(req, idAdd = true) {
    let colName = '';
    if (idAdd) {
        colName = '配給コード';
        req.checkBody('codeVale', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
        req.checkBody('codeVale', Message.Common.getMaxLengthHalfByte(colName, MAX_LENGTH))
            .isAlphanumeric().len({ max: MAX_LENGTH });
    }
    colName = '名称';
    req.checkBody('name.ja', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('name.ja', Message.Common.getMaxLength(colName, MAX_LENGTH)).len({ max: MAX_LENGTH });
}
