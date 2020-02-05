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
const chevre = require("@chevre/api-nodejs-client");
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
        const offerService = new chevre.service.Offer({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const subjectService = new chevre.service.Subject({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const subjectList = yield subjectService.getSubjectList();
        const searchOfferCategoryTypesResult = yield categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.OfferCategoryType } }
        });
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
                    req.body.id = '';
                    let ticketType = createFromBody(req);
                    // 券種コード重複確認
                    const { data } = yield offerService.searchTicketTypes({
                        project: { ids: [req.project.id] },
                        identifier: `^${ticketType.identifier}$`
                    });
                    if (data.length > 0) {
                        throw new Error(`既に存在する券種コードです: ${ticketType.identifier}`);
                    }
                    ticketType = yield offerService.createTicketType(ticketType);
                    req.flash('message', '登録しました');
                    res.redirect(`/ticketTypes/${ticketType.id}/update`);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        const forms = Object.assign({ name: {}, alternateName: {}, description: {}, priceSpecification: { accounting: {} }, isBoxTicket: (_.isEmpty(req.body.isBoxTicket)) ? '' : req.body.isBoxTicket, isOnlineTicket: (_.isEmpty(req.body.isOnlineTicket)) ? '' : req.body.isOnlineTicket, seatReservationUnit: (_.isEmpty(req.body.seatReservationUnit)) ? 1 : req.body.seatReservationUnit }, req.body);
        res.render('ticketType/add', {
            message: message,
            errors: errors,
            forms: forms,
            subjectList: subjectList,
            offerCategoryTypes: searchOfferCategoryTypesResult.data
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
        const offerService = new chevre.service.Offer({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const subjectService = new chevre.service.Subject({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const subjectList = yield subjectService.getSubjectList();
        const searchOfferCategoryTypesResult = yield categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.OfferCategoryType } }
        });
        let message = '';
        let errors = {};
        let ticketType = yield offerService.findTicketTypeById({ id: req.params.id });
        if (req.method === 'POST') {
            // 検証
            validateFormAdd(req);
            const validatorResult = yield req.getValidationResult();
            errors = req.validationErrors(true);
            // 検証
            if (validatorResult.isEmpty()) {
                // 券種DB更新プロセス
                try {
                    req.body.id = req.params.id;
                    ticketType = createFromBody(req);
                    yield offerService.updateTicketType(ticketType);
                    req.flash('message', '更新しました');
                    res.redirect(req.originalUrl);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        if (ticketType.priceSpecification === undefined) {
            throw new Error('ticketType.priceSpecification undefined');
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
        if (ticketType.priceSpecification.referenceQuantity.value !== undefined) {
            seatReservationUnit = ticketType.priceSpecification.referenceQuantity.value;
        }
        const additionalProperty = (ticketType.additionalProperty !== undefined) ? ticketType.additionalProperty : [];
        const nameForPrinting = additionalProperty.find((p) => p.name === 'nameForPrinting');
        const accountsReceivable = (ticketType.priceSpecification.accounting !== undefined)
            ? ticketType.priceSpecification.accounting.accountsReceivable
            : '';
        const forms = Object.assign({ alternateName: {} }, ticketType, { category: (ticketType.category !== undefined) ? ticketType.category.id : '', nameForPrinting: (nameForPrinting !== undefined) ? nameForPrinting.value : '', price: Math.floor(Number(ticketType.priceSpecification.price) / seatReservationUnit), accountsReceivable: Math.floor(Number(accountsReceivable) / seatReservationUnit) }, req.body, { isBoxTicket: (_.isEmpty(req.body.isBoxTicket)) ? isBoxTicket : req.body.isBoxTicket, isOnlineTicket: (_.isEmpty(req.body.isOnlineTicket)) ? isOnlineTicket : req.body.isOnlineTicket, seatReservationUnit: (_.isEmpty(req.body.seatReservationUnit)) ? seatReservationUnit : req.body.seatReservationUnit, subject: (_.isEmpty(req.body.subject))
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
            subjectList: subjectList,
            offerCategoryTypes: searchOfferCategoryTypesResult.data
        });
    });
}
exports.update = update;
function createFromBody(req) {
    // availabilityをフォーム値によって作成
    let availability = chevre.factory.itemAvailability.OutOfStock;
    if (req.body.isBoxTicket === '1' && req.body.isOnlineTicket === '1') {
        availability = chevre.factory.itemAvailability.InStock;
    }
    else if (req.body.isBoxTicket === '1') {
        availability = chevre.factory.itemAvailability.InStoreOnly;
    }
    else if (req.body.isOnlineTicket === '1') {
        availability = chevre.factory.itemAvailability.OnlineOnly;
    }
    const referenceQuantity = {
        typeOf: 'QuantitativeValue',
        value: Number(req.body.seatReservationUnit),
        unitCode: chevre.factory.unitCode.C62
    };
    const appliesToMovieTicketType = (typeof req.body.appliesToMovieTicketType === 'string' && req.body.appliesToMovieTicketType.length > 0)
        ? req.body.appliesToMovieTicketType
        : undefined;
    return {
        project: req.project,
        typeOf: 'Offer',
        priceCurrency: chevre.factory.priceCurrency.JPY,
        id: req.body.id,
        identifier: req.body.identifier,
        name: req.body.name,
        description: req.body.description,
        alternateName: { ja: req.body.alternateName.ja, en: '' },
        availability: availability,
        priceSpecification: {
            project: req.project,
            typeOf: chevre.factory.priceSpecificationType.UnitPriceSpecification,
            price: Number(req.body.price) * referenceQuantity.value,
            priceCurrency: chevre.factory.priceCurrency.JPY,
            valueAddedTaxIncluded: true,
            referenceQuantity: referenceQuantity,
            appliesToMovieTicketType: appliesToMovieTicketType,
            accounting: {
                typeOf: 'Accounting',
                operatingRevenue: {
                    typeOf: 'AccountTitle',
                    identifier: req.body.subject,
                    name: ''
                },
                nonOperatingRevenue: {
                    typeOf: 'AccountTitle',
                    identifier: req.body.nonBoxOfficeSubject,
                    name: ''
                },
                accountsReceivable: Number(req.body.accountsReceivable) * referenceQuantity.value
            }
        },
        additionalProperty: [
            {
                name: 'nameForPrinting',
                value: req.body.nameForPrinting
            }
        ],
        category: {
            project: { typeOf: req.project.typeOf, id: req.project.id },
            id: req.body.category
        },
        color: req.body.indicatorColor
    };
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
            // 券種グループ取得
            let ticketTypeIds = [];
            if (req.query.ticketTypeGroups !== undefined && req.query.ticketTypeGroups !== '') {
                const ticketTypeGroup = yield offerService.findTicketTypeGroupById({ id: req.query.ticketTypeGroups });
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
            }
            const limit = Number(req.query.limit);
            const page = Number(req.query.page);
            const { data } = yield offerService.searchTicketTypes({
                limit: limit,
                page: page,
                project: { ids: [req.project.id] },
                ids: (ticketTypeIds.length > 0) ? ticketTypeIds : undefined,
                identifier: req.query.identifier,
                name: req.query.name
            });
            res.json({
                success: true,
                count: (data.length === Number(limit))
                    ? (Number(page) * Number(limit)) + 1
                    : ((Number(page) - 1) * Number(limit)) + Number(data.length),
                results: data.map((t) => {
                    return Object.assign({}, t, { ticketCode: t.identifier });
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
        const offerService = new chevre.service.Offer({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const ticketTypeGroupsList = yield offerService.searchTicketTypeGroups({
            project: { ids: [req.project.id] }
        });
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
            const offerService = new chevre.service.Offer({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const limit = 100;
            const page = 1;
            const { data } = yield offerService.searchTicketTypeGroups({
                limit: limit,
                page: page,
                project: { ids: [req.project.id] },
                ticketTypes: [req.params.ticketTypeId]
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
exports.getTicketTypeGroupList = getTicketTypeGroupList;
/**
 * 券種マスタ新規登録画面検証
 */
function validateFormAdd(req) {
    // 券種コード
    let colName = '券種コード';
    req.checkBody('identifier', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('identifier', Message.Common.getMaxLengthHalfByte(colName, NAME_MAX_LENGTH_CODE))
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
    req.checkBody('alternateName.ja', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('alternateName.ja', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA))
        .len({ max: NAME_MAX_LENGTH_NAME_JA });
    // 印刷用券種名
    colName = '印刷用券種名';
    req.checkBody('nameForPrinting', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('nameForPrinting', Message.Common.getMaxLength(colName, NAME_PRITING_MAX_LENGTH_NAME_JA))
        .len({ max: NAME_PRITING_MAX_LENGTH_NAME_JA });
    // 購入席単位追加
    colName = '購入席単位追加';
    req.checkBody('seatReservationUnit', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    colName = '発生金額';
    req.checkBody('price', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('price', Message.Common.getMaxLengthHalfByte(colName, CHAGE_MAX_LENGTH))
        .isNumeric().len({ max: CHAGE_MAX_LENGTH });
    colName = '売上金額';
    req.checkBody('accountsReceivable', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('accountsReceivable', Message.Common.getMaxLengthHalfByte(colName, CHAGE_MAX_LENGTH))
        .isNumeric().len({ max: CHAGE_MAX_LENGTH });
    colName = '細目';
    req.checkBody('subject', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
}
