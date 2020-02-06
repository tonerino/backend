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
    const categoryCodeService = new chevre.service.CategoryCode({
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
                    project: { typeOf: <'Project'>'Project', id: req.project.id },
                    typeOf: <'CategoryCode'>'CategoryCode',
                    id: '',
                    codeValue: req.body.codeVale,
                    inCodeSet: {
                        typeOf: <'CategoryCodeSet'>'CategoryCodeSet',
                        identifier: chevre.factory.categoryCode.CategorySetIdentifier.DistributorType
                    },
                    name: req.body.name
                };
                const { data } = await categoryCodeService.search({
                    project: { id: { $eq: req.project.id } },
                    inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.DistributorType } },
                    codeValue: {
                        $eq: req.body.id
                    }
                });
                if (data.length > 0) {
                    message = '配給コードが既に登録されています。';
                } else {
                    await categoryCodeService.create(distribution);
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
        ...req.body
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
        const categoryCodeService = new chevre.service.CategoryCode({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        const limit = Number(req.query.limit);
        const page = Number(req.query.page);
        const { data } = await categoryCodeService.search({
            limit: limit,
            page: page,
            project: <any>{ id: { $eq: req.project.id } },
            inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.DistributorType } },
            codeValue: { $eq: (typeof req.query.id === 'string' && req.query.id.length > 0) ? req.query.id : undefined },
            name: {
                $regex: (typeof req.query.name === 'string' && req.query.name.length > 0) ? req.query.name : undefined
            }
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
export async function index(__: Request, res: Response): Promise<void> {
    // 配給マスタ画面遷移
    res.render('distributions/index', {
        message: ''
    });
}

/**
 * 編集
 */
export async function update(req: Request, res: Response): Promise<void> {
    const categoryCodeService = new chevre.service.CategoryCode({
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
            project: { typeOf: <'Project'>'Project', id: req.project.id },
            typeOf: <'CategoryCode'>'CategoryCode',
            id: req.params.id,
            codeValue: req.body.codeValue,
            inCodeSet: {
                typeOf: <'CategoryCodeSet'>'CategoryCodeSet',
                identifier: chevre.factory.categoryCode.CategorySetIdentifier.DistributorType
            },
            name: req.body.name
            // id: req.params.id,
            // name: req.body.name
        };
        await categoryCodeService.update(distribution);
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
        req.checkBody('codeVale', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
        req.checkBody('codeVale', Message.Common.getMaxLengthHalfByte(colName, MAX_LENGTH))
            .isAlphanumeric().len({ max: MAX_LENGTH });
    }
    colName = '名称';
    req.checkBody('name.ja', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('name.ja', Message.Common.getMaxLength(colName, MAX_LENGTH)).len({ max: MAX_LENGTH });
}
