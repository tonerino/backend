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
 * 券種グループマスタコントローラー
 */
const chevre = require("@toei-jp/chevre-api-nodejs-client");
const _ = require("underscore");
const Message = require("../common/Const/Message");
// 券種グループコード 半角64
const NAME_MAX_LENGTH_CODE = 64;
// 券種グループ名・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA = 64;
/**
 * 一覧
 */
function index(__, res) {
    return __awaiter(this, void 0, void 0, function* () {
        // 券種グループマスタ画面遷移
        res.render('ticketTypeGroup/index', {
            message: '',
            ticketTypes: undefined
        });
    });
}
exports.index = index;
/**
 * 新規登録
 */
function add(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const ticketTypeService = new chevre.service.TicketType({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        let message = '';
        let errors = {};
        if (req.method === 'POST') {
            // バリデーション
            validate(req);
            const validatorResult = yield req.getValidationResult();
            errors = req.validationErrors(true);
            if (validatorResult.isEmpty()) {
                try {
                    const ticketTypeGroup = {
                        id: req.body.id,
                        name: req.body.name,
                        description: req.body.description,
                        notes: req.body.notes,
                        ticketTypes: req.body.ticketTypes
                    };
                    yield ticketTypeService.createTicketTypeGroup(ticketTypeGroup);
                    message = '登録完了';
                    res.redirect('/complete');
                    // res.redirect(`/ticketTypeGroups/${ticketTypeGroup.id}/update`);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        // 券種マスタから取得
        const searchTicketTypesResult = yield ticketTypeService.searchTicketTypes({});
        const forms = {
            id: (_.isEmpty(req.body.id)) ? '' : req.body.id,
            name: (_.isEmpty(req.body.name)) ? '' : req.body.name,
            ticketTypes: (_.isEmpty(req.body.ticketTypes)) ? [] : req.body.ticketTypes,
            description: (_.isEmpty(req.body.description)) ? {} : req.body.description,
            notes: (_.isEmpty(req.body.notes)) ? {} : req.body.notes
        };
        res.render('ticketTypeGroup/add', {
            message: message,
            errors: errors,
            ticketTypes: searchTicketTypesResult.data,
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
        const ticketTypeService = new chevre.service.TicketType({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        let message = '';
        let errors = {};
        if (req.method === 'POST') {
            // バリデーション
            validate(req);
            const validatorResult = yield req.getValidationResult();
            errors = req.validationErrors(true);
            if (validatorResult.isEmpty()) {
                // 券種グループDB登録
                try {
                    // 券種グループDB登録
                    const ticketTypeGroup = {
                        id: req.params.id,
                        name: req.body.name,
                        description: req.body.description,
                        notes: req.body.notes,
                        ticketTypes: req.body.ticketTypes
                    };
                    yield ticketTypeService.updateTicketTypeGroup(ticketTypeGroup);
                    message = '編集完了';
                    res.redirect(`/ticketTypeGroups/${ticketTypeGroup.id}/update`);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        // 券種マスタから取得
        const searchTicketTypesResult = yield ticketTypeService.searchTicketTypes({});
        // 券種グループ取得
        const ticketGroup = yield ticketTypeService.findTicketTypeGroupById({ id: req.params.id });
        const forms = {
            id: (_.isEmpty(req.body.id)) ? ticketGroup.id : req.body.id,
            name: (_.isEmpty(req.body.name)) ? ticketGroup.name : req.body.name,
            ticketTypes: (_.isEmpty(req.body.ticketTypes)) ? ticketGroup.ticketTypes : req.body.ticketTypes,
            description: (_.isEmpty(req.body.description)) ? ticketGroup.description : req.body.description,
            notes: (_.isEmpty(req.body.notes)) ? ticketGroup.notes : req.body.notes
        };
        res.render('ticketTypeGroup/update', {
            message: message,
            errors: errors,
            ticketTypes: searchTicketTypesResult.data,
            forms: forms
        });
    });
}
exports.update = update;
/**
 * 一覧データ取得API
 */
function getList(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const ticketTypeService = new chevre.service.TicketType({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const { totalCount, data } = yield ticketTypeService.searchTicketTypeGroups({
                limit: req.query.limit,
                page: req.query.page,
                id: req.query.id,
                name: req.query.name
            });
            res.json({
                success: true,
                count: totalCount,
                results: data.map((g) => {
                    return {
                        id: g.id,
                        ticketGroupCode: g.id,
                        ticketGroupNameJa: g.name.ja
                    };
                })
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
 * 関連券種
 */
function getTicketTypeList(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const ticketTypeService = new chevre.service.TicketType({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            // 券種グループ取得
            const ticketGroup = yield ticketTypeService.findTicketTypeGroupById({ id: req.query.id });
            // 券種
            const ticketTypeNameList = [];
            for (const ticketType of ticketGroup.ticketTypes) {
                // console.log(ticketType);
                const ticketTypeData = yield ticketTypeService.findTicketTypeById({ id: ticketType });
                ticketTypeNameList.push(ticketTypeData.name.ja);
            }
            res.json({
                success: true,
                count: ticketGroup.ticketTypes.length,
                results: ticketTypeNameList
            });
        }
        catch (err) {
            res.json({
                success: false,
                results: err
            });
        }
    });
}
exports.getTicketTypeList = getTicketTypeList;
/**
 * 券種グループマスタ新規登録画面検証
 */
function validate(req) {
    // 券種グループコード
    let colName = '券種グループコード';
    req.checkBody('id', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('id', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_CODE });
    colName = 'サイト表示用券種グループ名';
    req.checkBody('name.ja', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('name.ja', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA)).len({ max: NAME_MAX_LENGTH_NAME_JA });
    colName = '券種グループ名(英)';
    req.checkBody('name.en', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    // tslint:disable-next-line:no-magic-numbers
    req.checkBody('name.en', Message.Common.getMaxLength(colName, 128)).len({ max: 128 });
}
