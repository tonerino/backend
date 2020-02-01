/**
 * 配給マスタコントローラー
 */
import * as chevre from '@chevre/api-nodejs-client';
import * as createDebug from 'debug';
import { Request, Response } from 'express';
import { NO_CONTENT } from 'http-status';
import * as _ from 'underscore';
import * as Message from '../common/Const/Message';

const debug = createDebug('chevre-backend:controllers');

const MAX_LENGTH = 64;

/**
 * 新規登録
 */
export async function add(req: Request, res: Response): Promise<void> {
    const distributionService = new chevre.service.Distributions({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    let message = '';
    let errors: any = {};
    if (req.method === 'POST') {
        // 検証
        validateForm(req);
        const validatorResult = await req.getValidationResult();
        errors = req.validationErrors(true);
        // 検証
        if (validatorResult.isEmpty()) {
            // 配給DB登録プロセス
            try {
                const distribution = {
                    id: req.body.id,
                    name: req.body.name
                };
                const { data } = await distributionService.searchDistribution({
                    id: req.body.id
                });
                if (data.length > 0) {
                    message = '配給コードが既に登録されています。';
                } else {
                    await distributionService.createDistribution(distribution);
                    req.flash('message', '登録しました');
                    res.redirect('/distributions');

                    return;
                }
            } catch (error) {
                message = error.message;
            }
        }
    }
    const forms = {
        id: (_.isEmpty(req.body.id)) ? '' : req.body.id,
        name: (_.isEmpty(req.body.name)) ? '' : req.body.name
    };
    res.render('distributions/add', {
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
        const distributionService = new chevre.service.Distributions({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        const limit = Number(req.query.limit);
        const page = Number(req.query.page);
        const { data } = await distributionService.searchDistribution({
            limit: limit,
            page: page,
            id: (typeof req.query.id === 'string' && req.query.id.length > 0) ? req.query.id : undefined,
            name: (typeof req.query.name === 'string' && req.query.name.length > 0) ? req.query.name : undefined
        });
        res.json({
            success: true,
            count: (data.length === Number(limit))
                ? (Number(page) * Number(limit)) + 1
                : ((Number(page) - 1) * Number(limit)) + Number(data.length),
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
 * 一覧
 */
export async function index(req: Request, res: Response): Promise<void> {
    const offerService = new chevre.service.Offer({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    const ticketTypeGroupsList = await offerService.searchTicketTypeGroups({});
    // 配給マスタ画面遷移
    res.render('distributions/index', {
        message: '',
        ticketTypeGroupsList: ticketTypeGroupsList.data
    });
}

/**
 * 編集
 */
export async function update(req: Request, res: Response): Promise<void> {
    const distributionService = new chevre.service.Distributions({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    // 検証
    validateForm(req, false);
    const validatorResult = await req.getValidationResult();
    const validations = req.validationErrors(true);
    if (!validatorResult.isEmpty()) {
        res.json({
            validation: validations,
            error: null
        });

        return;
    }
    // 配給DB更新プロセス
    try {
        const distribution = {
            id: req.params.id,
            name: req.body.name
        };
        await distributionService.updateDistribution(distribution);
        res.status(NO_CONTENT).end();
    } catch (err) {
        debug('update error', err);
        res.json({
            validation: null,
            error: err.message
        });
    }
}

/**
 * 配給マスタ新規登録画面検証
 */
function validateForm(req: Request, idAdd: boolean = true): void {
    let colName: string = '';
    if (idAdd) {
        colName = '配給コード';
        req.checkBody('id', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
        req.checkBody('id', Message.Common.getMaxLengthHalfByte(colName, MAX_LENGTH))
            .isAlphanumeric().len({ max: MAX_LENGTH });
    }
    colName = '名称';
    req.checkBody('name', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('name', Message.Common.getMaxLength(colName, MAX_LENGTH)).len({ max: MAX_LENGTH });
}
