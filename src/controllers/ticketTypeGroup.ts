/**
 * 券種グループマスタコントローラー
 */
import * as chevre from '@toei-jp/chevre-api-nodejs-client';
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
    const ticketTypeService = new chevre.service.TicketType({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const boxOfficeTypeService = new chevre.service.BoxOfficeType({
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
                await ticketTypeService.createTicketTypeGroup(ticketTypeGroup);
                req.flash('message', '登録しました');
                res.redirect(`/ticketTypeGroups/${ticketTypeGroup.id}/update`);

                return;
            } catch (error) {
                message = error.message;
            }
        }
    }
    const boxOfficeTypeList = await boxOfficeTypeService.getBoxOfficeTypeList();
    let ticketTypeIds: string[] = [];
    if (!_.isEmpty(req.body.ticketTypes)) {
        if (_.isString(req.body.ticketTypes)) {
            ticketTypeIds = [req.body.ticketTypes];
        } else {
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
    const searchTicketTypesResult: {
        count: number;
        data: any;
    } = {
        count: 0,
        data: []
    };
    if (forms.ticketTypes.length > 0) {
        const ticketTypes = await ticketTypeService.searchTicketTypes({
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
}
/**
 * 編集
 */
export async function update(req: Request, res: Response): Promise<void> {
    const ticketTypeService = new chevre.service.TicketType({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const boxOfficeTypeService = new chevre.service.BoxOfficeType({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const boxOfficeTypeList = await boxOfficeTypeService.getBoxOfficeTypeList();
    let message = '';
    let errors: any = {};
    let ticketTypeIds: string[] = [];
    if (!_.isEmpty(req.body.ticketTypes)) {
        if (_.isString(req.body.ticketTypes)) {
            ticketTypeIds = [req.body.ticketTypes];
        } else {
            ticketTypeIds = req.body.ticketTypes;
        }
    }
    if (req.method === 'POST') {
        // バリデーション
        validate(req);
        const validatorResult = await req.getValidationResult();
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
                await ticketTypeService.updateTicketTypeGroup(ticketTypeGroup);
                req.flash('message', '更新しました');
                res.redirect(req.originalUrl);

                return;
            } catch (error) {
                message = error.message;
            }
        }
    }
    // 券種グループ取得
    const ticketGroup = await ticketTypeService.findTicketTypeGroupById({ id: req.params.id });
    const forms = {
        boxOfficeType: {},
        ...ticketGroup,
        ...req.body,
        ticketTypes: (_.isEmpty(req.body.ticketTypes)) ? ticketGroup.ticketTypes : ticketTypeIds
    };

    // 券種マスタから取得
    const searchTicketTypesResult = await ticketTypeService.searchTicketTypes({
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
        const { totalCount, data } = await ticketTypeService.searchTicketTypeGroups({
            limit: req.query.limit,
            page: req.query.page,
            id: req.query.id,
            name: req.query.name
        });
        res.json({
            success: true,
            count: totalCount,
            results: data.map((g) => {
                return {
                    ...g,
                    ticketGroupCode: g.id
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
        const ticketTypeService = new chevre.service.TicketType({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        // 券種グループ取得
        const ticketGroup = await ticketTypeService.findTicketTypeGroupById({ id: req.query.id });
        const searchTicketTypesResult = await ticketTypeService.searchTicketTypes({
            limit: 100,
            ids: ticketGroup.ticketTypes
        });
        res.json({
            success: true,
            count: searchTicketTypesResult.totalCount,
            results: searchTicketTypesResult.data.map((t) => t.name.ja)
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
        const ticketTypeService = new chevre.service.TicketType({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        // 券種グループ取得
        const searchTicketTypesResult = await ticketTypeService.searchTicketTypes({
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
        const ticketTypeService = new chevre.service.TicketType({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        const ticketTypeGroupId: string = req.params.id;

        // 削除して問題ない券種グループかどうか検証
        const searchEventsResult = await eventService.searchScreeningEvents({
            limit: 1,
            ticketTypeGroups: [ticketTypeGroupId],
            sort: { endDate: chevre.factory.sortType.Descending }
        });
        if (searchEventsResult.data.length > 0) {
            if (moment(searchEventsResult.data[0].endDate) >= moment()) {
                throw new Error('終了していないスケジュールが存在します');
            }
        }

        await ticketTypeService.deleteTicketTypeGroup({ id: ticketTypeGroupId });
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
