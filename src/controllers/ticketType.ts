/**
 * 券種マスタコントローラー
 */
import * as chevre from '@chevre/api-nodejs-client';
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
    const offerService = new chevre.service.Offer({
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
            // 券種DB登録プロセス
            try {
                req.body.id = '';
                let ticketType = createFromBody(req);
                ticketType = await offerService.createTicketType(ticketType);
                req.flash('message', '登録しました');
                res.redirect(`/ticketTypes/${ticketType.id}/update`);

                return;
            } catch (error) {
                message = error.message;
            }
        }
    }
    const forms = {
        name: {},
        alternateName: {},
        description: {},
        priceSpecification: { accounting: {} },
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
    const offerService = new chevre.service.Offer({
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
    let ticketType = await offerService.findTicketTypeById({ id: req.params.id });
    if (req.method === 'POST') {
        // 検証
        validateFormAdd(req);
        const validatorResult = await req.getValidationResult();
        errors = req.validationErrors(true);
        // 検証
        if (validatorResult.isEmpty()) {
            // 券種DB更新プロセス
            try {
                req.body.id = req.params.id;
                ticketType = createFromBody(req);
                await offerService.updateTicketType(ticketType);
                req.flash('message', '更新しました');
                res.redirect(req.originalUrl);

                return;
            } catch (error) {
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

    const forms = {
        alternateName: {},
        ...ticketType,
        category: (ticketType.category !== undefined) ? ticketType.category.id : '',
        nameForPrinting: (nameForPrinting !== undefined) ? nameForPrinting.value : '',
        price: Math.floor(Number(ticketType.priceSpecification.price) / seatReservationUnit),
        accountsReceivable: Math.floor(Number(accountsReceivable) / seatReservationUnit),
        ...req.body,
        isBoxTicket: (_.isEmpty(req.body.isBoxTicket)) ? isBoxTicket : req.body.isBoxTicket,
        isOnlineTicket: (_.isEmpty(req.body.isOnlineTicket)) ? isOnlineTicket : req.body.isOnlineTicket,
        seatReservationUnit: (_.isEmpty(req.body.seatReservationUnit)) ? seatReservationUnit : req.body.seatReservationUnit,
        subject: (_.isEmpty(req.body.subject))
            ? (ticketType.priceSpecification.accounting !== undefined)
                ? (<any>ticketType.priceSpecification.accounting.operatingRevenue).identifier : undefined
            : req.body.subject,
        nonBoxOfficeSubject: (_.isEmpty(req.body.nonBoxOfficeSubject))
            ? (ticketType.priceSpecification.accounting !== undefined
                && ticketType.priceSpecification.accounting.nonOperatingRevenue !== undefined)
                ? (<any>ticketType.priceSpecification.accounting.nonOperatingRevenue).identifier : undefined
            : req.body.nonBoxOfficeSubject
    };
    res.render('ticketType/update', {
        message: message,
        errors: errors,
        forms: forms,
        subjectList: subjectList
    });
}

function createFromBody(req: Request): chevre.factory.ticketType.ITicketType {
    // availabilityをフォーム値によって作成
    let availability: chevre.factory.itemAvailability = chevre.factory.itemAvailability.OutOfStock;
    if (req.body.isBoxTicket === '1' && req.body.isOnlineTicket === '1') {
        availability = chevre.factory.itemAvailability.InStock;
    } else if (req.body.isBoxTicket === '1') {
        availability = chevre.factory.itemAvailability.InStoreOnly;
    } else if (req.body.isOnlineTicket === '1') {
        availability = chevre.factory.itemAvailability.OnlineOnly;
    }

    const referenceQuantity = {
        typeOf: <'QuantitativeValue'>'QuantitativeValue',
        value: Number(req.body.seatReservationUnit),
        unitCode: chevre.factory.unitCode.C62
    };

    const appliesToMovieTicketType =
        (typeof req.body.appliesToMovieTicketType === 'string' && (<string>req.body.appliesToMovieTicketType).length > 0)
            ? <string>req.body.appliesToMovieTicketType
            : undefined;

    return {
        project: req.project,
        typeOf: <chevre.factory.offerType>'Offer',
        priceCurrency: chevre.factory.priceCurrency.JPY,
        id: req.body.id,
        identifier: req.body.identifier,
        name: req.body.name,
        description: req.body.description,
        alternateName: { ja: <string>req.body.alternateName.ja, en: '' },
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
                operatingRevenue: <any>{
                    typeOf: 'AccountTitle',
                    identifier: req.body.subject,
                    name: ''
                },
                nonOperatingRevenue: <any>{
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
                value: <string>req.body.nameForPrinting
            }
        ],
        category: {
            id: <chevre.factory.ticketTypeCategory>req.body.category
        },
        color: <string>req.body.indicatorColor
    };
}

/**
 * 一覧データ取得API
 */
export async function getList(req: Request, res: Response): Promise<void> {
    try {
        const offerService = new chevre.service.Offer({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        // 券種グループ取得
        let ticketTypeIds: string[] = [];
        if (req.query.ticketTypeGroups !== undefined && req.query.ticketTypeGroups !== '') {
            const ticketTypeGroup = await offerService.findTicketTypeGroupById({ id: req.query.ticketTypeGroups });
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
        }

        const result = await offerService.searchTicketTypes({
            limit: req.query.limit,
            page: req.query.page,
            ids: (ticketTypeIds.length > 0) ? ticketTypeIds : undefined,
            identifier: req.query.identifier,
            name: req.query.name
        });
        res.json({
            success: true,
            count: result.totalCount,
            results: result.data.map((t) => {
                return {
                    ...t,
                    ticketCode: t.identifier
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
    const offerService = new chevre.service.Offer({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const ticketTypeGroupsList = await offerService.searchTicketTypeGroups({});
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
        const offerService = new chevre.service.Offer({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const { totalCount, data } = await offerService.searchTicketTypeGroups({
            limit: 100,
            ticketTypes: [req.params.ticketTypeId]
        });
        res.json({
            success: true,
            count: totalCount,
            results: data
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
