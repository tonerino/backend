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
                    const ticketType = {
                        id: req.body.id,
                        name: req.body.name,
                        description: req.body.description,
                        notes: req.body.notes,
                        price: req.body.price,
                        isBoxTicket: (req.body.isBoxTicket === '1') ? true : false,
                        isOnlineTicket: (req.body.isOnlineTicket === '1') ? true : false,
                        nameForManagementSite: req.body.nameForManagementSite,
                        nameForPrinting: req.body.nameForPrinting,
                        seatReservationUnit: req.body.seatReservationUnit,
                        subject: req.body.subject,
                        nonBoxOfficeSubject: req.body.nonBoxOfficeSubject,
                        typeOfNote: req.body.typeOfNote,
                        indicatorColor: req.body.indicatorColor
                    };
                    yield ticketTypeService.createTicketType(ticketType);
                    message = '登録完了';
                    res.redirect('/complete');
                    // res.redirect(`/ticketTypes/${ticketType.id}/update`);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        const forms = {
            id: (_.isEmpty(req.body.id)) ? '' : req.body.id,
            name: (_.isEmpty(req.body.name)) ? {} : req.body.name,
            price: (_.isEmpty(req.body.price)) ? '' : req.body.price,
            description: (_.isEmpty(req.body.description)) ? {} : req.body.description,
            notes: (_.isEmpty(req.body.notes)) ? {} : req.body.notes,
            indicatorColor: (_.isEmpty(req.body.indicatorColor)) ? '' : req.body.indicatorColor,
            isBoxTicket: (_.isEmpty(req.body.isBoxTicket)) ? '' : req.body.isBoxTicket,
            isOnlineTicket: (_.isEmpty(req.body.isOnlineTicket)) ? '' : req.body.isOnlineTicket,
            nameForManagementSite: (_.isEmpty(req.body.nameForManagementSite)) ? '' : req.body.nameForManagementSite,
            nameForPrinting: (_.isEmpty(req.body.nameForPrinting)) ? '' : req.body.nameForPrinting,
            seatReservationUnit: (_.isEmpty(req.body.seatReservationUnit)) ? '' : req.body.seatReservationUnit,
            subject: (_.isEmpty(req.body.subject)) ? '' : req.body.subject,
            nonBoxOfficeSubject: (_.isEmpty(req.body.nonBoxOfficeSubject)) ? '' : req.body.nonBoxOfficeSubject,
            typeOfNote: (_.isEmpty(req.body.typeOfNote)) ? '' : req.body.typeOfNote
        };
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
                    ticketType = {
                        id: req.params.id,
                        name: req.body.name,
                        description: req.body.description,
                        notes: req.body.notes,
                        price: req.body.price,
                        isBoxTicket: (req.body.isBoxTicket === '1') ? true : false,
                        isOnlineTicket: (req.body.isOnlineTicket === '1') ? true : false,
                        nameForManagementSite: req.body.nameForManagementSite,
                        nameForPrinting: req.body.nameForPrinting,
                        seatReservationUnit: req.body.seatReservationUnit,
                        subject: req.body.subject,
                        nonBoxOfficeSubject: req.body.nonBoxOfficeSubject,
                        typeOfNote: req.body.typeOfNote,
                        indicatorColor: req.body.indicatorColor
                    };
                    yield ticketTypeService.updateTicketType(ticketType);
                    message = '編集完了';
                    res.redirect(`/ticketTypes/${ticketType.id}/update`);
                    return;
                }
                catch (error) {
                    message = error.message;
                }
            }
        }
        const forms = {
            id: (_.isEmpty(req.body.id)) ? ticketType.id : req.body.id,
            name: (_.isEmpty(req.body.name)) ? ticketType.name : req.body.name,
            price: (_.isEmpty(req.body.price)) ? ticketType.price : req.body.price,
            description: (_.isEmpty(req.body.description)) ? ticketType.description : req.body.description,
            notes: (_.isEmpty(req.body.notes)) ? ticketType.notes : req.body.notes,
            indicatorColor: (_.isEmpty(req.body.indicatorColor)) ? ticketType.indicatorColor : req.body.indicatorColor,
            isBoxTicket: (_.isEmpty(req.body.isBoxTicket)) ? ticketType.isBoxTicket : req.body.isBoxTicket,
            isOnlineTicket: (_.isEmpty(req.body.isOnlineTicket)) ? ticketType.isOnlineTicket : req.body.isOnlineTicket,
            nameForManagementSite: (_.isEmpty(req.body.nameForManagementSite)) ?
                ticketType.nameForManagementSite : req.body.nameForManagementSite,
            nameForPrinting: (_.isEmpty(req.body.nameForPrinting)) ? ticketType.nameForPrinting : req.body.nameForPrinting,
            seatReservationUnit: (_.isEmpty(req.body.seatReservationUnit)) ? ticketType.seatReservationUnit : req.body.seatReservationUnit,
            subject: (_.isEmpty(req.body.subject)) ? ticketType.subject : req.body.subject,
            nonBoxOfficeSubject: (_.isEmpty(req.body.nonBoxOfficeSubject)) ? ticketType.nonBoxOfficeSubject : req.body.nonBoxOfficeSubject,
            typeOfNote: (_.isEmpty(req.body.typeOfNote)) ? ticketType.typeOfNote : req.body.typeOfNote
        };
        res.render('ticketType/update', {
            message: message,
            errors: errors,
            forms: forms,
            subjectList: subjectList
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
                id: ticketTypeIds,
                name: req.query.name
            });
            res.json({
                success: true,
                count: result.totalCount,
                results: result.data.map((t) => {
                    return {
                        id: t.id,
                        ticketCode: t.id,
                        managementTypeName: t.name.ja,
                        ticketPrice: t.price
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
    // 管理用券種名
    // colName = '管理用券種名';
    // req.checkBody('managementTypeName', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    // req.checkBody(
    //     'managementTypeName',
    //     Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_EN)).len({ max: NAME_MAX_LENGTH_NAME_JA }
    //     );
    // 金額
    colName = '金額';
    req.checkBody('price', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('price', Message.Common.getMaxLengthHalfByte(colName, CHAGE_MAX_LENGTH)).isNumeric().len({ max: CHAGE_MAX_LENGTH });
    // 細目
    colName = '細目';
    req.checkBody('subject', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
}
