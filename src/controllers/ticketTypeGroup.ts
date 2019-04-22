/**
 * 券種グループマスタコントローラー
 */
import * as chevre from '@chevre/api-nodejs-client';
import { Request, Response } from 'express';
import { BAD_REQUEST, NO_CONTENT } from 'http-status';
import * as moment from 'moment';
import * as _ from 'underscore';

import * as Message from '../common/Const/Message';

// 券種グループコード 半角64
const NAME_MAX_LENGTH_CODE: number = 64;
// 券種グループ名・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA: number = 64;

/**
 * 一覧
 */
export async function index(__: Request, res: Response): Promise<void> {
    // 券種グループマスタ画面遷移
    res.render('ticketTypeGroup/index', {
        message: '',
        ticketTypes: undefined
    });
}
/**
 * 新規登録
 */
export async function add(req: Request, res: Response): Promise<void> {
    const offerService = new chevre.service.Offer({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const serviceTypeService = new chevre.service.ServiceType({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    let message = '';
    let errors: any = {};
    if (req.method === 'POST') {
        // バリデーション
        validate(req);
        const validatorResult = await req.getValidationResult();
        errors = req.validationErrors(true);
        console.error(errors);
        if (validatorResult.isEmpty()) {
            try {
                req.body.id = '';
                let ticketTypeGroup = await createFromBody(req);
                ticketTypeGroup = await offerService.createTicketTypeGroup(ticketTypeGroup);
                req.flash('message', '登録しました');
                res.redirect(`/ticketTypeGroups/${ticketTypeGroup.id}/update`);

                return;
            } catch (error) {
                message = error.message;
            }
        }
    }

    let ticketTypeIds: string[] = [];
    if (!_.isEmpty(req.body.ticketTypes)) {
        if (_.isString(req.body.ticketTypes)) {
            ticketTypeIds = [req.body.ticketTypes];
        } else {
            ticketTypeIds = req.body.ticketTypes;
        }
    }
    const forms = {
        ...req.body,
        name: (_.isEmpty(req.body.name)) ? {} : req.body.name,
        ticketTypes: (_.isEmpty(req.body.ticketTypes)) ? [] : ticketTypeIds,
        description: (_.isEmpty(req.body.description)) ? {} : req.body.description,
        alternateName: (_.isEmpty(req.body.alternateName)) ? {} : req.body.alternateName
    };

    // 券種マスタから取得
    let ticketTypes: chevre.factory.ticketType.ITicketType[] = [];
    if (forms.ticketTypes.length > 0) {
        const searchTicketTypesResult = await offerService.searchTicketTypes({
            sort: {
                'priceSpecification.price': chevre.factory.sortType.Descending
            },
            ids: forms.ticketTypes
        });
        ticketTypes = searchTicketTypesResult.data;
    }

    const searchServiceTypesResult = await serviceTypeService.search({ limit: 100 });

    res.render('ticketTypeGroup/add', {
        message: message,
        errors: errors,
        ticketTypes: ticketTypes,
        forms: forms,
        boxOfficeTypeList: searchServiceTypesResult.data
    });
}

/**
 * 編集
 */
export async function update(req: Request, res: Response): Promise<void> {
    const offerService = new chevre.service.Offer({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const serviceTypeService = new chevre.service.ServiceType({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const searchServiceTypesResult = await serviceTypeService.search({ limit: 100 });
    let message = '';
    let errors: any = {};
    if (req.method === 'POST') {
        // バリデーション
        validate(req);
        const validatorResult = await req.getValidationResult();
        errors = req.validationErrors(true);
        if (validatorResult.isEmpty()) {
            // 券種グループDB登録
            try {
                // 券種グループDB登録
                req.body.id = req.params.id;
                const ticketTypeGroup = await createFromBody(req);
                await offerService.updateTicketTypeGroup(ticketTypeGroup);
                req.flash('message', '更新しました');
                res.redirect(req.originalUrl);

                return;
            } catch (error) {
                message = error.message;
            }
        }
    }
    // 券種グループ取得
    const ticketGroup = await offerService.findTicketTypeGroupById({ id: req.params.id });
    const forms = {
        ...ticketGroup,
        serviceType: ticketGroup.itemOffered.serviceType.id,
        ...req.body,
        ticketTypes: (_.isEmpty(req.body.ticketTypes)) ? ticketGroup.ticketTypes : []
    };

    // 券種マスタから取得
    let ticketTypes: chevre.factory.ticketType.ITicketType[] = [];
    if (forms.ticketTypes.length > 0) {
        const searchTicketTypesResult = await offerService.searchTicketTypes({
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
}

async function createFromBody(req: Request): Promise<chevre.factory.ticketType.ITicketTypeGroup> {
    const ticketTypes = (Array.isArray(req.body.ticketTypes)) ? <string[]>req.body.ticketTypes : [<string>req.body.ticketTypes];

    const serviceTypeService = new chevre.service.ServiceType({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const serviceType = await serviceTypeService.findById({ id: req.body.serviceType });

    return {
        project: req.project,
        id: req.body.id,
        identifier: req.body.identifier,
        name: req.body.name,
        description: req.body.description,
        alternateName: req.body.alternateName,
        ticketTypes: [...new Set(ticketTypes)], // 念のため券種IDをユニークに
        itemOffered: {
            serviceType: serviceType
        }
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
        const { totalCount, data } = await offerService.searchTicketTypeGroups({
            limit: req.query.limit,
            page: req.query.page,
            identifier: req.query.identifier,
            name: req.query.name
        });
        res.json({
            success: true,
            count: totalCount,
            results: data.map((g) => {
                return {
                    ...g,
                    ticketGroupCode: g.identifier
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
 * 関連券種
 */
export async function getTicketTypeList(req: Request, res: Response): Promise<void> {
    try {
        const offerService = new chevre.service.Offer({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        // 券種グループ取得
        const ticketGroup = await offerService.findTicketTypeGroupById({ id: req.query.id });
        const searchTicketTypesResult = await offerService.searchTicketTypes({
            limit: 100,
            ids: ticketGroup.ticketTypes
        });
        res.json({
            success: true,
            count: searchTicketTypesResult.totalCount,
            results: searchTicketTypesResult.data.map((t) => (t.alternateName !== undefined) ? t.alternateName.ja : t.name.ja)
        });
    } catch (err) {
        res.json({
            success: false,
            results: err
        });
    }
}
/**
 * 券種金額
 */
export async function getTicketTypePriceList(req: Request, res: Response): Promise<void> {
    try {
        const offerService = new chevre.service.Offer({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        // 指定価格の券種検索
        const searchTicketTypesResult = await offerService.searchTicketTypes({
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
    } catch (err) {
        res.json({
            success: false,
            results: err
        });
    }
}
/**
 * 削除
 */
export async function deleteById(req: Request, res: Response): Promise<void> {
    try {
        const eventService = new chevre.service.Event({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const offerService = new chevre.service.Offer({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        const ticketTypeGroupId: string = req.params.id;

        // 削除して問題ない券種グループかどうか検証
        const searchEventsResult = await eventService.search({
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

        await offerService.deleteTicketTypeGroup({ id: ticketTypeGroupId });
        res.status(NO_CONTENT).end();
    } catch (error) {
        res.status(BAD_REQUEST).json({ error: { message: error.message } });
    }
}
/**
 * 券種グループマスタ新規登録画面検証
 */
function validate(req: Request): void {
    // 券種グループコード
    let colName: string = '券種グループコード';
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
