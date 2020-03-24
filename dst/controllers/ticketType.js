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
const POS_CLIENT_ID = process.env.POS_CLIENT_ID;
const FRONTEND_CLIENT_ID = process.env.FRONTEND_CLIENT_ID;
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
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const accountTitles = yield searchAllAccountTitles(req);
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
                    let ticketType = yield createFromBody(req, true);
                    // コード重複確認
                    const { data } = yield offerService.search({
                        project: { id: { $eq: req.project.id } },
                        identifier: { $eq: ticketType.identifier }
                    });
                    if (data.length > 0) {
                        throw new Error(`既に存在する券種コードです: ${ticketType.identifier}`);
                    }
                    ticketType = yield offerService.create(ticketType);
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
            subjectList: accountTitles,
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
    var _a, _b, _c, _d, _e, _f;
    return __awaiter(this, void 0, void 0, function* () {
        const offerService = new chevre.service.Offer({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const accountTitles = yield searchAllAccountTitles(req);
        const searchOfferCategoryTypesResult = yield categoryCodeService.search({
            limit: 100,
            project: { id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.OfferCategoryType } }
        });
        let message = '';
        let errors = {};
        let ticketType = yield offerService.findById({ id: req.params.id });
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
                    ticketType = yield createFromBody(req, false);
                    yield offerService.update(ticketType);
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
        const forms = Object.assign(Object.assign(Object.assign(Object.assign({ alternateName: {} }, ticketType), { category: (ticketType.category !== undefined) ? ticketType.category.codeValue : '', nameForPrinting: (nameForPrinting !== undefined) ? nameForPrinting.value : '', price: Math.floor(Number(ticketType.priceSpecification.price) / seatReservationUnit), accountsReceivable: Math.floor(Number(accountsReceivable) / seatReservationUnit) }), req.body), { isBoxTicket: (_.isEmpty(req.body.isBoxTicket)) ? isBoxTicket : req.body.isBoxTicket, isOnlineTicket: (_.isEmpty(req.body.isOnlineTicket)) ? isOnlineTicket : req.body.isOnlineTicket, seatReservationUnit: (_.isEmpty(req.body.seatReservationUnit)) ? seatReservationUnit : req.body.seatReservationUnit, subject: (_.isEmpty(req.body.subject))
                ? (typeof ((_b = (_a = ticketType.priceSpecification.accounting) === null || _a === void 0 ? void 0 : _a.operatingRevenue) === null || _b === void 0 ? void 0 : _b.codeValue) === 'string')
                    ? (_d = (_c = ticketType.priceSpecification.accounting) === null || _c === void 0 ? void 0 : _c.operatingRevenue) === null || _d === void 0 ? void 0 : _d.codeValue : undefined
                : req.body.subject, nonBoxOfficeSubject: (_.isEmpty(req.body.nonBoxOfficeSubject))
                ? (ticketType.priceSpecification.accounting !== undefined
                    && ticketType.priceSpecification.accounting.nonOperatingRevenue !== undefined)
                    ? (_f = (_e = ticketType.priceSpecification.accounting) === null || _e === void 0 ? void 0 : _e.nonOperatingRevenue) === null || _f === void 0 ? void 0 : _f.codeValue : undefined
                : req.body.nonBoxOfficeSubject });
        res.render('ticketType/update', {
            message: message,
            errors: errors,
            forms: forms,
            subjectList: accountTitles,
            offerCategoryTypes: searchOfferCategoryTypesResult.data
        });
    });
}
exports.update = update;
function searchAllAccountTitles(req) {
    return __awaiter(this, void 0, void 0, function* () {
        const accountTitleService = new chevre.service.AccountTitle({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const limit = 100;
        let page = 0;
        let numData = limit;
        const accountTitles = [];
        while (numData === limit) {
            page += 1;
            const searchAccountTitlesResult = yield accountTitleService.search({
                limit: limit,
                page: page,
                project: { ids: [req.project.id] }
            });
            numData = searchAccountTitlesResult.data.length;
            accountTitles.push(...searchAccountTitlesResult.data);
        }
        return accountTitles;
    });
}
// tslint:disable-next-line:max-func-body-length
function createFromBody(req, isNew) {
    return __awaiter(this, void 0, void 0, function* () {
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        let offerCategory;
        if (typeof req.body.category === 'string' && req.body.category.length > 0) {
            const searchOfferCategoryTypesResult = yield categoryCodeService.search({
                limit: 1,
                project: { id: { $eq: req.project.id } },
                inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.OfferCategoryType } },
                codeValue: { $eq: req.body.category }
            });
            if (searchOfferCategoryTypesResult.data.length === 0) {
                throw new Error('オファーカテゴリーが見つかりません');
            }
            offerCategory = searchOfferCategoryTypesResult.data[0];
        }
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
        // 利用可能なアプリケーション設定
        const availableAtOrFrom = [];
        switch (availability) {
            case chevre.factory.itemAvailability.InStock:
                availableAtOrFrom.push({ id: POS_CLIENT_ID }, { id: FRONTEND_CLIENT_ID });
                break;
            case chevre.factory.itemAvailability.InStoreOnly:
                availableAtOrFrom.push({ id: POS_CLIENT_ID });
                break;
            case chevre.factory.itemAvailability.OnlineOnly:
                availableAtOrFrom.push({ id: FRONTEND_CLIENT_ID });
                break;
            default:
        }
        // 結局InStockに統一
        availability = chevre.factory.itemAvailability.InStock;
        const referenceQuantity = {
            typeOf: 'QuantitativeValue',
            value: Number(req.body.seatReservationUnit),
            unitCode: chevre.factory.unitCode.C62
        };
        const appliesToMovieTicketType = (typeof req.body.appliesToMovieTicketType === 'string' && req.body.appliesToMovieTicketType.length > 0)
            ? req.body.appliesToMovieTicketType
            : undefined;
        const itemOffered = {
            project: req.project,
            typeOf: 'EventService'
        };
        return Object.assign(Object.assign({ project: req.project, typeOf: 'Offer', priceCurrency: chevre.factory.priceCurrency.JPY, id: req.body.id, identifier: req.body.identifier, name: req.body.name, description: req.body.description, alternateName: { ja: req.body.alternateName.ja, en: '' }, availableAtOrFrom: availableAtOrFrom, availability: availability, itemOffered: itemOffered, priceSpecification: {
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
                        codeValue: req.body.subject,
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
            }, additionalProperty: [
                {
                    name: 'nameForPrinting',
                    value: req.body.nameForPrinting
                }
            ], color: req.body.indicatorColor }, (offerCategory !== undefined)
            ? {
                category: {
                    project: offerCategory.project,
                    id: offerCategory.id,
                    codeValue: offerCategory.codeValue
                }
            }
            : undefined), (!isNew)
            ? {
                $unset: Object.assign({}, (offerCategory === undefined) ? { category: 1 } : undefined)
            }
            : undefined);
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
            const offerCatalogService = new chevre.service.OfferCatalog({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            // 券種グループ取得
            let ticketTypeIds = [];
            if (req.query.ticketTypeGroups !== undefined && req.query.ticketTypeGroups !== '') {
                const ticketTypeGroup = yield offerCatalogService.findById({ id: req.query.ticketTypeGroups });
                if (Array.isArray(ticketTypeGroup.itemListElement)) {
                    ticketTypeIds = ticketTypeGroup.itemListElement.map((e) => e.id);
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
            const { data } = yield offerService.search({
                limit: limit,
                page: page,
                project: { id: { $eq: req.project.id } },
                id: { $in: (ticketTypeIds.length > 0) ? ticketTypeIds : undefined },
                identifier: { $regex: req.query.identifier },
                name: { $regex: req.query.name }
            });
            res.json({
                success: true,
                count: (data.length === Number(limit))
                    ? (Number(page) * Number(limit)) + 1
                    : ((Number(page) - 1) * Number(limit)) + Number(data.length),
                results: data.map((t) => {
                    return Object.assign(Object.assign({}, t), { ticketCode: t.identifier });
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
        const offerCatalogService = new chevre.service.OfferCatalog({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const ticketTypeGroupsList = yield offerCatalogService.search({
            project: { id: { $eq: req.project.id } },
            itemOffered: { typeOf: { $eq: 'EventService' } }
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
            const offerCatalogService = new chevre.service.OfferCatalog({
                endpoint: process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const limit = 100;
            const page = 1;
            const { data } = yield offerCatalogService.search({
                limit: limit,
                page: page,
                project: { id: { $eq: req.project.id } },
                itemListElement: {
                    id: { $in: [req.params.ticketTypeId] }
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
