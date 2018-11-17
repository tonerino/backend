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
const http_status_1 = require("http-status");
const moment = require("moment");
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
        const boxOfficeTypeService = new chevre.service.BoxOfficeType({
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
                        alternateName: req.body.alternateName,
                        ticketTypes: req.body.ticketTypes,
                        boxOfficeType: req.body.boxOfficeType
                    };
                    yield ticketTypeService.createTicketTypeGroup(ticketTypeGroup);
                    // message = '登録完了';
                    res.redirect('/complete');
                    // res.redirect(`/ticketTypeGroups/${ticketTypeGroup.id}/update`);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        const boxOfficeTypeList = yield boxOfficeTypeService.getBoxOfficeTypeList();
        let ticketTypeIds = [];
        if (!_.isEmpty(req.body.ticketTypes)) {
            if (_.isString(req.body.ticketTypes)) {
                ticketTypeIds = [req.body.ticketTypes];
            }
            else {
                ticketTypeIds = req.body.ticketTypes;
            }
        }
        const forms = {
            id: (_.isEmpty(req.body.id)) ? '' : req.body.id,
            name: (_.isEmpty(req.body.name)) ? '' : req.body.name,
            ticketTypes: (_.isEmpty(req.body.ticketTypes)) ? [] : ticketTypeIds,
            description: (_.isEmpty(req.body.description)) ? {} : req.body.description,
            alternateName: (_.isEmpty(req.body.alternateName)) ? {} : req.body.alternateName,
            boxOfficeType: (_.isEmpty(req.body.boxOfficeType)) ? {} : req.body.boxOfficeType
        };
        // 券種マスタから取得
        const searchTicketTypesResult = {
            count: 0,
            data: []
        };
        if (forms.ticketTypes.length > 0) {
            const ticketTypes = yield ticketTypeService.searchTicketTypes({
                ids: forms.ticketTypes
            });
            for (let x = 0; x < forms.ticketTypes.length;) {
                searchTicketTypesResult.data[x] = ticketTypes.data.find((y) => y.id === forms.ticketTypes[x]);
                x = x + 1;
            }
            searchTicketTypesResult.count = forms.ticketTypes.length;
        }
        res.render('ticketTypeGroup/add', {
            message: message,
            errors: errors,
            ticketTypes: searchTicketTypesResult,
            forms: forms,
            boxOfficeTypeList: boxOfficeTypeList
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
        const boxOfficeTypeService = new chevre.service.BoxOfficeType({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const boxOfficeTypeList = yield boxOfficeTypeService.getBoxOfficeTypeList();
        let message = '';
        let errors = {};
        let ticketTypeIds = [];
        if (!_.isEmpty(req.body.ticketTypes)) {
            if (_.isString(req.body.ticketTypes)) {
                ticketTypeIds = [req.body.ticketTypes];
            }
            else {
                ticketTypeIds = req.body.ticketTypes;
            }
        }
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
                        alternateName: req.body.alternateName,
                        ticketTypes: ticketTypeIds,
                        boxOfficeType: req.body.boxOfficeType
                    };
                    yield ticketTypeService.updateTicketTypeGroup(ticketTypeGroup);
                    // message = '編集完了';
                    res.redirect(`/ticketTypeGroups/${ticketTypeGroup.id}/update`);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        // 券種グループ取得
        const ticketGroup = yield ticketTypeService.findTicketTypeGroupById({ id: req.params.id });
        const forms = Object.assign({ boxOfficeType: {} }, ticketGroup, req.body, { ticketTypes: (_.isEmpty(req.body.ticketTypes)) ? ticketGroup.ticketTypes : ticketTypeIds });
        // 券種マスタから取得
        const searchTicketTypesResult = yield ticketTypeService.searchTicketTypes({
            sort: {
                'priceSpecification.price': chevre.factory.sortType.Descending
            },
            ids: forms.ticketTypes
        });
        res.render('ticketTypeGroup/update', {
            message: message,
            errors: errors,
            ticketTypes: searchTicketTypesResult.data,
            forms: forms,
            boxOfficeTypeList: boxOfficeTypeList
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
                    return Object.assign({}, g, { ticketGroupCode: g.id });
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
            let countData = 0;
            if (ticketGroup.ticketTypes !== null) {
                countData = ticketGroup.ticketTypes.length;
                for (const ticketType of ticketGroup.ticketTypes) {
                    const ticketTypeData = yield ticketTypeService.findTicketTypeById({ id: ticketType });
                    ticketTypeNameList.push(ticketTypeData.name.ja);
                }
            }
            res.json({
                success: true,
                count: countData,
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
 * 券種金額
 */
function getTicketTypePriceList(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const ticketTypeService = new chevre.service.TicketType({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            // 券種グループ取得
            const searchTicketTypesResult = yield ticketTypeService.searchTicketTypes({
                limit: 100,
                sort: {
                    'priceSpecification.price': chevre.factory.sortType.Descending
                },
                priceSpecification: {
                    maxPrice: Number(req.query.price)
                }
            });
            res.json({
                success: true,
                count: searchTicketTypesResult.totalCount,
                results: searchTicketTypesResult.data
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
exports.getTicketTypePriceList = getTicketTypePriceList;
/**
 * 削除
 */
function deleteById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const eventService = new chevre.service.Event({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const ticketTypeService = new chevre.service.TicketType({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const ticketTypeGroupId = req.params.id;
            // 削除して問題ない券種グループかどうか検証
            const searchEventsResult = yield eventService.searchScreeningEvents({
                limit: 1,
                ticketTypeGroups: [ticketTypeGroupId],
                sort: { endDate: chevre.factory.sortType.Descending }
            });
            if (searchEventsResult.data.length > 0) {
                if (moment(searchEventsResult.data[0].endDate) >= moment()) {
                    throw new Error('終了していないスケジュールが存在します');
                }
            }
            yield ticketTypeService.deleteTicketTypeGroup({ id: ticketTypeGroupId });
            res.status(http_status_1.NO_CONTENT).end();
        }
        catch (error) {
            res.status(http_status_1.BAD_REQUEST).json({ error: { message: error.message } });
        }
    });
}
exports.deleteById = deleteById;
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
    // 興行区分
    colName = '興行区分';
    req.checkBody('boxOfficeType.id', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    //対象券種名
    colName = '対象券種名';
    req.checkBody('ticketTypes', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
}
