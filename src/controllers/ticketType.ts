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
export async function add(req: Request, res: Response): Promise<void> {
    const ticketTypeService = new chevre.service.TicketType({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
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
                const ticketType = {
                    id: req.body.id,
                    name: req.body.name,
                    description: req.body.description,
                    notes: req.body.notes,
                    charge: req.body.charge,
                    boxOnly: (req.body.boxOnly === '1') ? true : false,
                    onlineOnly: (req.body.onlineOnly === '1') ? true : false,
                    nameForManagementSite: req.body.nameForManagementSite,
                    nameForPrinting: req.body.nameForPrinting,
                    seatReservationUnit: req.body.seatReservationUnit,
                    subject: 1,
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
        id: (_.isEmpty(req.body.id)) ? '' : req.body.id,
        name: (_.isEmpty(req.body.name)) ? {} : req.body.name,
        charge: (_.isEmpty(req.body.charge)) ? '' : req.body.charge,
        description: (_.isEmpty(req.body.description)) ? {} : req.body.description,
        notes: (_.isEmpty(req.body.notes)) ? {} : req.body.notes,
        indicatorColor: (_.isEmpty(req.body.indicatorColor)) ? '' : req.body.indicatorColor,
        boxOnly: (_.isEmpty(req.body.boxOnly)) ? '' : req.body.boxOnly,
        onlineOnly: (_.isEmpty(req.body.onlineOnly)) ? '' : req.body.onlineOnly,
        nameForManagementSite: (_.isEmpty(req.body.nameForManagementSite)) ? '' : req.body.nameForManagementSite,
        nameForPrinting: (_.isEmpty(req.body.nameForPrinting)) ? '' : req.body.nameForPrinting,
        seatReservationUnit: (_.isEmpty(req.body.seatReservationUnit)) ? '' : req.body.seatReservationUnit,
        subject: 1,
        typeOfNote: (_.isEmpty(req.body.typeOfNote)) ? '' : req.body.typeOfNote
    };
    res.render('ticketType/add', {
        message: message,
        errors: errors,
        forms: forms
    });
}

/**
 * 編集
 */
export async function update(req: Request, res: Response): Promise<void> {
    const ticketTypeService = new chevre.service.TicketType({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
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
            // 券種DB更新プロセス
            try {
                ticketType = {
                    id: req.params.id,
                    name: req.body.name,
                    description: req.body.description,
                    notes: req.body.notes,
                    charge: req.body.charge,
                    boxOnly: (req.body.boxOnly === '1') ? true : false,
                    onlineOnly: (req.body.onlineOnly === '1') ? true : false,
                    nameForManagementSite: req.body.nameForManagementSite,
                    nameForPrinting: req.body.nameForPrinting,
                    seatReservationUnit: req.body.seatReservationUnit,
                    subject: 1,
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
    const forms = {
        id: (_.isEmpty(req.body.id)) ? ticketType.id : req.body.id,
        name: (_.isEmpty(req.body.name)) ? ticketType.name : req.body.name,
        charge: (_.isEmpty(req.body.charge)) ? ticketType.charge : req.body.charge,
        description: (_.isEmpty(req.body.description)) ? ticketType.description : req.body.description,
        notes: (_.isEmpty(req.body.notes)) ? ticketType.notes : req.body.notes,
        indicatorColor: (_.isEmpty(req.body.indicatorColor)) ? ticketType.indicatorColor : req.body.indicatorColor,
        boxOnly: (_.isEmpty(req.body.boxOnly)) ? ticketType.boxOnly : req.body.boxOnly,
        onlineOnly: (_.isEmpty(req.body.onlineOnly)) ? ticketType.onlineOnly : req.body.onlineOnly,
        nameForManagementSite: (_.isEmpty(req.body.nameForManagementSite)) ?
                                    ticketType.nameForManagementSite : req.body.nameForManagementSite,
        nameForPrinting: (_.isEmpty(req.body.nameForPrinting)) ? ticketType.nameForPrinting : req.body.nameForPrinting,
        seatReservationUnit: (_.isEmpty(req.body.seatReservationUnit)) ? ticketType.seatReservationUnit : req.body.seatReservationUnit,
        subject: 1,
        typeOfNote: (_.isEmpty(req.body.typeOfNote)) ? ticketType.typeOfNote : req.body.typeOfNote
    };
    res.render('ticketType/update', {
        message: message,
        errors: errors,
        forms: forms
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
        let ticketTypeIds: any = [];
        if (req.query.ticketTypeGroups !== undefined && req.query.ticketTypeGroups !== '') {
            const ticketTypeGroup = await ticketTypeService.findTicketTypeGroupById({ id: req.query.ticketTypeGroups });
            ticketTypeIds = ticketTypeGroup.ticketTypes;
            if (ticketTypeIds.indexOf(req.query.id) && req.query.id !== '' && req.query.id !== undefined) {
                ticketTypeIds.push(req.query.id);
            }
        }  else {
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
                    id: t.id,
                    ticketCode: t.id,
                    managementTypeName: t.name.ja,
                    ticketCharge: t.charge
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
    req.checkBody('charge', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('charge', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_EN)).len({ max: CHAGE_MAX_LENGTH });
}
