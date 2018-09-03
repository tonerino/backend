/**
 * 券種グループマスタコントローラー
 */
import * as chevre from '@toei-jp/chevre-api-nodejs-client';
import { Request, Response } from 'express';
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
        message: ''
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
                    notes: req.body.notes,
                    ticketTypes: req.body.ticketTypes
                };
                await ticketTypeService.createTicketTypeGroup(ticketTypeGroup);
                message = '登録完了';
                res.redirect(`/ticketTypeGroups/${ticketTypeGroup.id}/update`);

                return;
            } catch (error) {
                message = error.message;
            }
        }
    }
    // 券種マスタから取得
    const searchTicketTypesResult = await ticketTypeService.searchTicketTypes({});
    const forms = {
        id: (_.isEmpty(req.body.id)) ? '' : req.body.id,
        name: (_.isEmpty(req.body.name)) ? '' : req.body.name,
        ticketTypes: (_.isEmpty(req.body.ticketTypes)) ? [] : req.body.ticketTypes,
        description: (_.isEmpty(req.body.description)) ? {} : req.body.description,
        notes: (_.isEmpty(req.body.notes)) ? {} : req.body.notes
    };
    res.render('ticketTypeGroup/add', {
        message: message,
        errors: errors,
        ticketTypes: searchTicketTypesResult.data,
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
                    notes: req.body.notes,
                    ticketTypes: req.body.ticketTypes
                };
                await ticketTypeService.updateTicketTypeGroup(ticketTypeGroup);
                message = '編集完了';
                res.redirect(`/ticketTypeGroups/${ticketTypeGroup.id}/update`);

                return;
            } catch (error) {
                message = error.message;
            }
        }
    }
    // 券種マスタから取得
    const searchTicketTypesResult = await ticketTypeService.searchTicketTypes({});
    // 券種グループ取得
    const ticketGroup = await ticketTypeService.findTicketTypeGroupById({ id: req.params.id });
    const forms = {
        id: (_.isEmpty(req.body.id)) ? ticketGroup.id : req.body.id,
        name: (_.isEmpty(req.body.name)) ? ticketGroup.name : req.body.name,
        ticketTypes: (_.isEmpty(req.body.ticketTypes)) ? ticketGroup.ticketTypes : req.body.ticketTypes,
        description: (_.isEmpty(req.body.description)) ? ticketGroup.description : req.body.description,
        notes: (_.isEmpty(req.body.notes)) ? ticketGroup.notes : req.body.notes
    };
    res.render('ticketTypeGroup/update', {
        message: message,
        errors: errors,
        ticketTypes: searchTicketTypesResult.data,
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
                    id: g.id,
                    ticketGroupCode: g.id,
                    ticketGroupNameJa: g.name.ja
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
}
