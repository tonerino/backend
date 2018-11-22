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
 * 券種マスタコントローラー
 */
const chevre = require("@toei-jp/chevre-api-nodejs-client");
const _ = require("underscore");
const Message = require("../common/Const/Message");
// 券種コード 半角64
const NAME_MAX_LENGTH_CODE = 64;
// 券種名・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA = 64;
// 印刷用券種名・日本語 全角64
const NAME_PRITING_MAX_LENGTH_NAME_JA = 30;
// 券種名・英語 半角128
const NAME_MAX_LENGTH_NAME_EN = 64;
// 金額
const CHAGE_MAX_LENGTH = 10;
/**
 * 新規登録
 */
// tslint:disable-next-line:cyclomatic-complexity
function add(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const ticketTypeService = new chevre.service.TicketType({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const subjectService = new chevre.service.Subject({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const subjectList = yield subjectService.getSubjectList();
        let message = '';
        let errors = {};
        if (req.method === 'POST') {
            // 検証
            validateFormAdd(req);
            const validatorResult = yield req.getValidationResult();
            errors = req.validationErrors(true);
            // 検証
            if (validatorResult.isEmpty()) {
                // 券種DB登録プロセス
                try {
                    const ticketType = createFromBody(req.body);
                    yield ticketTypeService.createTicketType(ticketType);
                    req.flash('message', '登録しました');
                    res.redirect(`/ticketTypes/${ticketType.id}/update`);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        const forms = Object.assign({ name: {}, description: {}, priceSpecification: { accounting: {} }, isBoxTicket: (_.isEmpty(req.body.isBoxTicket)) ? '' : req.body.isBoxTicket, isOnlineTicket: (_.isEmpty(req.body.isOnlineTicket)) ? '' : req.body.isOnlineTicket, seatReservationUnit: (_.isEmpty(req.body.seatReservationUnit)) ? 1 : req.body.seatReservationUnit }, req.body);
        res.render('ticketType/add', {
            message: message,
            errors: errors,
            forms: forms,
            subjectList: subjectList
        });
    });
}
exports.add = add;
/**
 * 編集
 */
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
function update(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const ticketTypeService = new chevre.service.TicketType({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const subjectService = new chevre.service.Subject({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const subjectList = yield subjectService.getSubjectList();
        let message = '';
        let errors = {};
        let ticketType = yield ticketTypeService.findTicketTypeById({ id: req.params.id });
        if (req.method === 'POST') {
            // 検証
            validateFormAdd(req);
            const validatorResult = yield req.getValidationResult();
            errors = req.validationErrors(true);
            // 検証
            if (validatorResult.isEmpty()) {
                // 券種DB更新プロセス
                try {
                    ticketType = createFromBody(req.body);
                    yield ticketTypeService.updateTicketType(ticketType);
                    req.flash('message', '更新しました');
                    res.redirect(req.originalUrl);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        let isBoxTicket = false;
        let isOnlineTicket = false;
        switch (ticketType.availability) {
            case chevre.factory.itemAvailability.InStock:
                isBoxTicket = true;
                isOnlineTicket = true;
                break;
            case chevre.factory.itemAvailability.InStoreOnly:
                isBoxTicket = true;
                break;
            case chevre.factory.itemAvailability.OnlineOnly:
                isOnlineTicket = true;
                break;
            default:
        }
        let seatReservationUnit = 1;
        if (ticketType.eligibleQuantity !== undefined && ticketType.eligibleQuantity.value !== undefined) {
            seatReservationUnit = ticketType.eligibleQuantity.value;
        }
        const forms = Object.assign({}, ticketType, req.body, { isBoxTicket: (_.isEmpty(req.body.isBoxTicket)) ? isBoxTicket : req.body.isBoxTicket, isOnlineTicket: (_.isEmpty(req.body.isOnlineTicket)) ? isOnlineTicket : req.body.isOnlineTicket, seatReservationUnit: (_.isEmpty(req.body.seatReservationUnit)) ? seatReservationUnit : req.body.seatReservationUnit, subject: (_.isEmpty(req.body.subject))
                ? (ticketType.priceSpecification.accounting !== undefined)
                    ? ticketType.priceSpecification.accounting.operatingRevenue.identifier : undefined
                : req.body.subject, nonBoxOfficeSubject: (_.isEmpty(req.body.nonBoxOfficeSubject))
                ? (ticketType.priceSpecification.accounting !== undefined
                    && ticketType.priceSpecification.accounting.nonOperatingRevenue !== undefined)
                    ? ticketType.priceSpecification.accounting.nonOperatingRevenue.identifier : undefined
                : req.body.nonBoxOfficeSubject });
        res.render('ticketType/update', {
            message: message,
            errors: errors,
            forms: forms,
            subjectList: subjectList
        });
    });
}
exports.update = update;
function createFromBody(body) {
    // availabilityをフォーム値によって作成
    let availability = chevre.factory.itemAvailability.OutOfStock;
    if (body.isBoxTicket === '1' && body.isOnlineTicket === '1') {
        availability = chevre.factory.itemAvailability.InStock;
    }
    else if (body.isBoxTicket === '1') {
        availability = chevre.factory.itemAvailability.InStoreOnly;
    }
    else if (body.isOnlineTicket === '1') {
        availability = chevre.factory.itemAvailability.OnlineOnly;
    }
    return {
        typeOf: 'Offer',
        priceCurrency: chevre.factory.priceCurrency.JPY,
        id: body.id,
        name: body.name,
        description: body.description,
        alternateName: body.alternateName,
        availability: availability,
        priceSpecification: {
            typeOf: chevre.factory.priceSpecificationType.UnitPriceSpecification,
            price: Number(body.priceSpecification.price),
            priceCurrency: chevre.factory.priceCurrency.JPY,
            valueAddedTaxIncluded: true,
            referenceQuantity: {
                typeOf: 'QuantitativeValue',
                value: Number(body.seatReservationUnit),
                unitCode: chevre.factory.unitCode.C62
            },
            appliesToMovieTicketType: body.appliesToMovieTicketType,
            accounting: {
                typeOf: 'Accounting',
                operatingRevenue: {
                    typeOf: 'AccountTitle',
                    identifier: body.subject,
                    name: ''
                },
                nonOperatingRevenue: {
                    typeOf: 'AccountTitle',
                    identifier: body.nonBoxOfficeSubject,
                    name: ''
                },
                accountsReceivable: Number(body.priceSpecification.accounting.accountsReceivable)
            }
        },
        nameForManagementSite: body.nameForManagementSite,
        nameForPrinting: body.nameForPrinting,
        typeOfNote: body.typeOfNote,
        indicatorColor: body.indicatorColor
    };
}
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
            // 券種グループ取得
            let ticketTypeIds = [];
            if (req.query.ticketTypeGroups !== undefined && req.query.ticketTypeGroups !== '') {
                const ticketTypeGroup = yield ticketTypeService.findTicketTypeGroupById({ id: req.query.ticketTypeGroups });
                if (ticketTypeGroup.ticketTypes !== null) {
                    ticketTypeIds = ticketTypeGroup.ticketTypes;
                }
                else {
                    //券種がありません。
                    res.json({
                        success: true,
                        count: 0,
                        results: []
                    });
                }
                if (req.query.id !== '' && req.query.id !== undefined) {
                    if (ticketTypeIds.indexOf(req.query.id) >= 0) {
                        ticketTypeIds.push(req.query.id);
                    }
                }
            }
            else {
                if (req.query.id !== '' && req.query.id !== undefined) {
                    ticketTypeIds.push(req.query.id);
                }
            }
            const result = yield ticketTypeService.searchTicketTypes({
                limit: req.query.limit,
                page: req.query.page,
                ids: ticketTypeIds,
                name: req.query.name
            });
            res.json({
                success: true,
                count: result.totalCount,
                results: result.data.map((t) => {
                    return Object.assign({}, t, { ticketCode: t.id });
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
 * 一覧
 */
function index(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const ticketTypeService = new chevre.service.TicketType({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const ticketTypeGroupsList = yield ticketTypeService.searchTicketTypeGroups({});
        // 券種マスタ画面遷移
        res.render('ticketType/index', {
            message: '',
            ticketTypeGroupsList: ticketTypeGroupsList.data
        });
    });
}
exports.index = index;
/**
 * 関連券種グループリスト
 */
function getTicketTypeGroupList(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const ticketTypeService = new chevre.service.TicketType({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            // const ticketType = await ticketTypeService.findTicketTypeById({ id: req.params.id });
            const ticketTypeGroups = yield ticketTypeService.getTicketTypeGroupList({ ticketTypeId: req.params.ticketTypeId });
            res.json({
                success: true,
                count: ticketTypeGroups.length,
                results: ticketTypeGroups
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
exports.getTicketTypeGroupList = getTicketTypeGroupList;
/**
 * 券種マスタ新規登録画面検証
 */
function validateFormAdd(req) {
    // 券種コード
    let colName = '券種コード';
    req.checkBody('id', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('id', Message.Common.getMaxLengthHalfByte(colName, NAME_MAX_LENGTH_CODE))
        .isAlphanumeric().len({ max: NAME_MAX_LENGTH_CODE });
    // サイト表示用券種名
    colName = 'サイト表示用券種名';
    req.checkBody('name.ja', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('name.ja', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_CODE)).len({ max: NAME_MAX_LENGTH_NAME_JA });
    // サイト表示用券種名英
    colName = 'サイト表示用券種名英';
    req.checkBody('name.en', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('name.en', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_EN)).len({ max: NAME_MAX_LENGTH_NAME_EN });
    // サイト管理用券種名
    colName = 'サイト管理用券種名';
    req.checkBody('nameForManagementSite', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('nameForManagementSite', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA))
        .len({ max: NAME_MAX_LENGTH_NAME_JA });
    // 印刷用券種名
    colName = '印刷用券種名';
    req.checkBody('nameForPrinting', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('nameForPrinting', Message.Common.getMaxLength(colName, NAME_PRITING_MAX_LENGTH_NAME_JA))
        .len({ max: NAME_PRITING_MAX_LENGTH_NAME_JA });
    // 購入席単位追加
    colName = '購入席単位追加';
    req.checkBody('seatReservationUnit', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    colName = '発生価格';
    req.checkBody('priceSpecification.price', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('priceSpecification.price', Message.Common.getMaxLengthHalfByte(colName, CHAGE_MAX_LENGTH))
        .isNumeric().len({ max: CHAGE_MAX_LENGTH });
    colName = '売上金額';
    req.checkBody('priceSpecification.accounting.accountsReceivable', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('priceSpecification.accounting.accountsReceivable', Message.Common.getMaxLengthHalfByte(colName, CHAGE_MAX_LENGTH))
        .isNumeric().len({ max: CHAGE_MAX_LENGTH });
    colName = '細目';
    req.checkBody('subject', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
}
