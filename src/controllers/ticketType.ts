/**
 * 券種マスタコントローラー
 */
import * as chevre from '@toei-jp/chevre-api-nodejs-client';
import { Request, Response } from 'express';
import * as _ from 'underscore';
import * as Message from '../common/Const/Message';

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
export async function add(req: Request, res: Response): Promise<void> {
    const ticketTypeService = new chevre.service.TicketType({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const subjectService = new chevre.service.Subject({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const subjectList = await subjectService.getSubjectList();
    let message = '';
    let errors: any = {};
    if (req.method === 'POST') {
        // 検証
        validateFormAdd(req);
        const validatorResult = await req.getValidationResult();
        errors = req.validationErrors(true);
        // 検証
        if (validatorResult.isEmpty()) {
            // availabilityをフォーム値によって作成
            let availability: chevre.factory.itemAvailability = chevre.factory.itemAvailability.OutOfStock;
            if (req.body.isBoxTicket === '1' && req.body.isOnlineTicket === '1') {
                availability = chevre.factory.itemAvailability.InStock;
            } else if (req.body.isBoxTicket === '1') {
                availability = chevre.factory.itemAvailability.InStoreOnly;
            } else if (req.body.isOnlineTicket === '1') {
                availability = chevre.factory.itemAvailability.OnlineOnly;
            }

            // 券種DB登録プロセス
            try {
                const ticketType: chevre.factory.ticketType.ITicketType = {
                    typeOf: <chevre.factory.offerType>'Offer',
                    id: req.body.id,
                    name: req.body.name,
                    description: req.body.description,
                    alternateName: req.body.alternateName,
                    price: req.body.price,
                    priceCurrency: chevre.factory.priceCurrency.JPY,
                    availability: availability,
                    eligibleQuantity: {
                        typeOf: 'QuantitativeValue',
                        value: Number(req.body.seatReservationUnit),
                        unitCode: chevre.factory.unitCode.C62
                    },
                    eligibleMovieTicketType: req.body.eligibleMovieTicketType,
                    nameForManagementSite: req.body.nameForManagementSite,
                    nameForPrinting: req.body.nameForPrinting,
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
                        accountsReceivable: Number(req.body.accounting.accountsReceivable)
                    },
                    typeOfNote: req.body.typeOfNote,
                    indicatorColor: req.body.indicatorColor
                };
                await ticketTypeService.createTicketType(ticketType);
                message = '登録完了';
                res.redirect('/complete');
                // res.redirect(`/ticketTypes/${ticketType.id}/update`);

                return;
            } catch (error) {
                message = error.message;
            }
        }
    }
    const forms = {
        name: {},
        description: {},
        accounting: {},
        isBoxTicket: (_.isEmpty(req.body.isBoxTicket)) ? '' : req.body.isBoxTicket,
        isOnlineTicket: (_.isEmpty(req.body.isOnlineTicket)) ? '' : req.body.isOnlineTicket,
        seatReservationUnit: (_.isEmpty(req.body.seatReservationUnit)) ? 1 : req.body.seatReservationUnit,
        ...req.body
    };
    res.render('ticketType/add', {
        message: message,
        errors: errors,
        forms: forms,
        subjectList: subjectList
    });
}

/**
 * 編集
 */
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
export async function update(req: Request, res: Response): Promise<void> {
    const ticketTypeService = new chevre.service.TicketType({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const subjectService = new chevre.service.Subject({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const subjectList = await subjectService.getSubjectList();
    let message = '';
    let errors: any = {};
    let ticketType = await ticketTypeService.findTicketTypeById({ id: req.params.id });
    if (req.method === 'POST') {
        // 検証
        validateFormAdd(req);
        const validatorResult = await req.getValidationResult();
        errors = req.validationErrors(true);
        // 検証
        if (validatorResult.isEmpty()) {
            // availabilityをフォーム値によって作成
            let availability: chevre.factory.itemAvailability = chevre.factory.itemAvailability.OutOfStock;
            if (req.body.isBoxTicket === '1' && req.body.isOnlineTicket === '1') {
                availability = chevre.factory.itemAvailability.InStock;
            } else if (req.body.isBoxTicket === '1') {
                availability = chevre.factory.itemAvailability.InStoreOnly;
            } else if (req.body.isOnlineTicket === '1') {
                availability = chevre.factory.itemAvailability.OnlineOnly;
            }

            // 券種DB更新プロセス
            try {
                ticketType = {
                    typeOf: <chevre.factory.offerType>'Offer',
                    id: req.params.id,
                    name: req.body.name,
                    description: req.body.description,
                    alternateName: req.body.alternateName,
                    price: req.body.price,
                    priceCurrency: chevre.factory.priceCurrency.JPY,
                    availability: availability,
                    nameForManagementSite: req.body.nameForManagementSite,
                    nameForPrinting: req.body.nameForPrinting,
                    eligibleQuantity: {
                        typeOf: 'QuantitativeValue',
                        value: Number(req.body.seatReservationUnit),
                        unitCode: chevre.factory.unitCode.C62
                    },
                    eligibleMovieTicketType: req.body.eligibleMovieTicketType,
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
                        accountsReceivable: Number(req.body.accounting.accountsReceivable)
                    },
                    typeOfNote: req.body.typeOfNote,
                    indicatorColor: req.body.indicatorColor
                };
                await ticketTypeService.updateTicketType(ticketType);
                message = '編集完了';
                res.redirect(`/ticketTypes/${ticketType.id}/update`);

                return;
            } catch (error) {
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
    if (ticketType.accounting === undefined) {
        // ticketType.accounting = { typeOf: 'Accounting', operatingRevenue: ticketType.subject, accountsReceivable: 0 };
    }
    const forms = {
        ...ticketType,
        ...req.body,
        isBoxTicket: (_.isEmpty(req.body.isBoxTicket)) ? isBoxTicket : req.body.isBoxTicket,
        isOnlineTicket: (_.isEmpty(req.body.isOnlineTicket)) ? isOnlineTicket : req.body.isOnlineTicket,
        seatReservationUnit: (_.isEmpty(req.body.seatReservationUnit)) ? seatReservationUnit : req.body.seatReservationUnit,
        subject: (_.isEmpty(req.body.subject)) ? ticketType.accounting.operatingRevenue.identifier : req.body.subject,
        nonBoxOfficeSubject: (_.isEmpty(req.body.nonBoxOfficeSubject))
            ? (ticketType.accounting.nonOperatingRevenue !== undefined) ? ticketType.accounting.nonOperatingRevenue.identifier : undefined
            : req.body.nonBoxOfficeSubject
    };
    res.render('ticketType/update', {
        message: message,
        errors: errors,
        forms: forms,
        subjectList: subjectList
    });
}
/**
 * 一覧データ取得API
 */
export async function getList(req: Request, res: Response): Promise<void> {
    try {
        const ticketTypeService = new chevre.service.TicketType({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        // 券種グループ取得
        let ticketTypeIds: string[] = [];
        if (req.query.ticketTypeGroups !== undefined && req.query.ticketTypeGroups !== '') {
            const ticketTypeGroup = await ticketTypeService.findTicketTypeGroupById({ id: req.query.ticketTypeGroups });
            if (ticketTypeGroup.ticketTypes !== null) {
                ticketTypeIds = ticketTypeGroup.ticketTypes;
            } else {
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
        } else {
            if (req.query.id !== '' && req.query.id !== undefined) {
                ticketTypeIds.push(req.query.id);
            }
        }

        const result = await ticketTypeService.searchTicketTypes({
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
                    ...t,
                    ticketCode: t.id,
                    eligibleMovieTicketType: (t.eligibleMovieTicketType !== undefined) ? t.eligibleMovieTicketType : ''
                };
            })
        });
    } catch (err) {
        res.json({
            success: false,
            count: 0,
            results: []
        });
    }
}
/**
 * 一覧
 */
export async function index(req: Request, res: Response): Promise<void> {
    const ticketTypeService = new chevre.service.TicketType({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const ticketTypeGroupsList = await ticketTypeService.searchTicketTypeGroups({});
    // 券種マスタ画面遷移
    res.render('ticketType/index', {
        message: '',
        ticketTypeGroupsList: ticketTypeGroupsList.data
    });
}
/**
 * 関連券種グループリスト
 */
export async function getTicketTypeGroupList(req: Request, res: Response): Promise<void> {
    try {
        const ticketTypeService = new chevre.service.TicketType({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        // const ticketType = await ticketTypeService.findTicketTypeById({ id: req.params.id });
        const ticketTypeGroups = await ticketTypeService.getTicketTypeGroupList({ ticketTypeId: req.params.ticketTypeId });
        res.json({
            success: true,
            count: ticketTypeGroups.length,
            results: ticketTypeGroups
        });
    } catch (err) {
        res.json({
            success: false,
            count: 0,
            results: []
        });
    }
}
/**
 * 券種マスタ新規登録画面検証
 */
function validateFormAdd(req: Request): void {
    // 券種コード
    let colName: string = '券種コード';
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

    colName = '売掛金額';
    req.checkBody('accounting.accountsReceivable', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('accounting.accountsReceivable', Message.Common.getMaxLengthHalfByte(colName, CHAGE_MAX_LENGTH))
        .isNumeric().len({ max: CHAGE_MAX_LENGTH });
}
