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
const chevre = require("@chevre/api-nodejs-client");
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
        const offerService = new chevre.service.Offer({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const serviceTypeService = new chevre.service.ServiceType({
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
            console.error(errors);
            if (validatorResult.isEmpty()) {
                try {
                    req.body.id = '';
                    let ticketTypeGroup = yield createFromBody(req);
                    ticketTypeGroup = yield offerService.createTicketTypeGroup(ticketTypeGroup);
                    req.flash('message', '登録しました');
                    res.redirect(`/ticketTypeGroups/${ticketTypeGroup.id}/update`);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        let ticketTypeIds = [];
        if (!_.isEmpty(req.body.ticketTypes)) {
            if (_.isString(req.body.ticketTypes)) {
                ticketTypeIds = [req.body.ticketTypes];
            }
            else {
                ticketTypeIds = req.body.ticketTypes;
            }
        }
        const forms = Object.assign({}, req.body, { name: (_.isEmpty(req.body.name)) ? {} : req.body.name, ticketTypes: (_.isEmpty(req.body.ticketTypes)) ? [] : ticketTypeIds, description: (_.isEmpty(req.body.description)) ? {} : req.body.description, alternateName: (_.isEmpty(req.body.alternateName)) ? {} : req.body.alternateName });
        // 券種マスタから取得
        let ticketTypes = [];
        if (forms.ticketTypes.length > 0) {
            const searchTicketTypesResult = yield offerService.searchTicketTypes({
                sort: {
                    'priceSpecification.price': chevre.factory.sortType.Descending
                },
                ids: forms.ticketTypes
            });
            ticketTypes = searchTicketTypesResult.data;
        }
        const searchServiceTypesResult = yield serviceTypeService.search({ limit: 100 });
        res.render('ticketTypeGroup/add', {
            message: message,
            errors: errors,
            ticketTypes: ticketTypes,
            forms: forms,
            boxOfficeTypeList: searchServiceTypesResult.data
        });
    });
}
exports.add = add;
/**
 * 編集
 */
function update(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const offerService = new chevre.service.Offer({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const serviceTypeService = new chevre.service.ServiceType({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchServiceTypesResult = yield serviceTypeService.search({ limit: 100 });
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
                    req.body.id = req.params.id;
                    const ticketTypeGroup = yield createFromBody(req);
                    yield offerService.updateTicketTypeGroup(ticketTypeGroup);
                    req.flash('message', '更新しました');
                    res.redirect(req.originalUrl);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        // 券種グループ取得
        const ticketGroup = yield offerService.findTicketTypeGroupById({ id: req.params.id });
        const forms = Object.assign({}, ticketGroup, { serviceType: ticketGroup.itemOffered.serviceType.id }, req.body, { ticketTypes: (_.isEmpty(req.body.ticketTypes)) ? ticketGroup.ticketTypes : [] });
        // 券種マスタから取得
        let ticketTypes = [];
        if (forms.ticketTypes.length > 0) {
            const searchTicketTypesResult = yield offerService.searchTicketTypes({
                limit: 100,
                // sort: {
                //     'priceSpecification.price': chevre.factory.sortType.Descending
                // },
                ids: forms.ticketTypes
            });
            ticketTypes = searchTicketTypesResult.data;
        }
        // 券種を発生金額(単価)でソート
        ticketTypes = ticketTypes.sort((a, b) => {
            if (a.priceSpecification === undefined) {
                throw new Error(`Price Specification undefined. Ticket Type:${a.id}`);
            }
            if (b.priceSpecification === undefined) {
                throw new Error(`Price Specification undefined. Ticket Type:${b.id}`);
            }
            const aUnitPrice = Math.floor(a.priceSpecification.price
                / ((a.priceSpecification.referenceQuantity.value !== undefined) ? a.priceSpecification.referenceQuantity.value : 1));
            const bUnitPrice = Math.floor(b.priceSpecification.price
                / ((b.priceSpecification.referenceQuantity.value !== undefined) ? b.priceSpecification.referenceQuantity.value : 1));
            return bUnitPrice - aUnitPrice;
        });
        res.render('ticketTypeGroup/update', {
            message: message,
            errors: errors,
            ticketTypes: ticketTypes,
            forms: forms,
            boxOfficeTypeList: searchServiceTypesResult.data
        });
    });
}
exports.update = update;
function createFromBody(req) {
    return __awaiter(this, void 0, void 0, function* () {
        const ticketTypes = (Array.isArray(req.body.ticketTypes)) ? req.body.ticketTypes : [req.body.ticketTypes];
        const serviceTypeService = new chevre.service.ServiceType({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const serviceType = yield serviceTypeService.findById({ id: req.body.serviceType });
        return {
            id: req.body.id,
            identifier: req.body.identifier,
            name: req.body.name,
            description: req.body.description,
            alternateName: req.body.alternateName,
            ticketTypes: [...new Set(ticketTypes)],
            itemOffered: {
                serviceType: serviceType
            }
        };
    });
}
/**
 * 一覧データ取得API
 */
function getList(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const offerService = new chevre.service.Offer({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const { totalCount, data } = yield offerService.searchTicketTypeGroups({
                limit: req.query.limit,
                page: req.query.page,
                identifier: req.query.identifier,
                name: req.query.name
            });
            res.json({
                success: true,
                count: totalCount,
                results: data.map((g) => {
                    return Object.assign({}, g, { ticketGroupCode: g.identifier });
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
            const offerService = new chevre.service.Offer({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            // 券種グループ取得
            const ticketGroup = yield offerService.findTicketTypeGroupById({ id: req.query.id });
            const searchTicketTypesResult = yield offerService.searchTicketTypes({
                limit: 100,
                ids: ticketGroup.ticketTypes
            });
            res.json({
                success: true,
                count: searchTicketTypesResult.totalCount,
                results: searchTicketTypesResult.data.map((t) => (t.alternateName !== undefined) ? t.alternateName.ja : t.name.ja)
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
            const offerService = new chevre.service.Offer({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            // 指定価格の券種検索
            const searchTicketTypesResult = yield offerService.searchTicketTypes({
                limit: 100,
                sort: {
                    'priceSpecification.price': chevre.factory.sortType.Descending
                },
                priceSpecification: {
                    // 売上金額で検索
                    accounting: {
                        minAccountsReceivable: Number(req.query.price),
                        maxAccountsReceivable: Number(req.query.price)
                    }
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
            const offerService = new chevre.service.Offer({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const ticketTypeGroupId = req.params.id;
            // 削除して問題ない券種グループかどうか検証
            const searchEventsResult = yield eventService.search({
                limit: 1,
                typeOf: chevre.factory.eventType.ScreeningEvent,
                offers: {
                    ids: [ticketTypeGroupId]
                },
                sort: { endDate: chevre.factory.sortType.Descending }
            });
            if (searchEventsResult.data.length > 0) {
                if (moment(searchEventsResult.data[0].endDate) >= moment()) {
                    throw new Error('終了していないスケジュールが存在します');
                }
            }
            yield offerService.deleteTicketTypeGroup({ id: ticketTypeGroupId });
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
    req.checkBody('identifier', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('identifier', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_CODE });
    colName = 'サイト表示用券種グループ名';
    req.checkBody('name.ja', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('name.ja', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA)).len({ max: NAME_MAX_LENGTH_NAME_JA });
    colName = '券種グループ名(英)';
    req.checkBody('name.en', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    // tslint:disable-next-line:no-magic-numbers
    req.checkBody('name.en', Message.Common.getMaxLength(colName, 128)).len({ max: 128 });
    // 興行区分
    colName = '興行区分';
    req.checkBody('serviceType', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    //対象券種名
    colName = '対象券種名';
    req.checkBody('ticketTypes', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
}
