/**
 * 勘定科目コントローラー
 */
import * as chevre from '@chevre/api-nodejs-client';
import * as createDebug from 'debug';
import { Request, Response } from 'express';
import * as _ from 'underscore';

import * as Message from '../common/Const/Message';

const debug = createDebug('chevre-backend:controllers');

// 作品コード 半角64
const NAME_MAX_LENGTH_CODE: number = 64;
// 作品名・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA: number = 64;

/**
 * 新規登録
 */
export async function add(req: Request, res: Response): Promise<void> {
    let message = '';
    let errors: any = {};
    if (req.method === 'POST') {
        // バリデーション
        validate(req);
        const validatorResult = await req.getValidationResult();
        errors = req.validationErrors(true);
        if (validatorResult.isEmpty()) {
            try {
                const subjectAttributest = createSubjectFromBody(req);
                debug('saving an subject...', subjectAttributest);
                const accountTitleService = new chevre.service.AccountTitle({
                    endpoint: <string>process.env.API_ENDPOINT,
                    auth: req.user.authClient
                });
                await accountTitleService.create(subjectAttributest);
                req.flash('message', '登録しました');
                res.redirect(`/subjects/${subjectAttributest.codeValue}/update`);

                return;
            } catch (error) {
                message = error.message;
            }
        }
    }
    const forms = req.body;
    // 科目画面遷移
    res.render('subject/add', {
        message: message,
        errors: errors,
        forms: forms
    });
}
/**
 * 編集
 */
export async function update(req: Request, res: Response): Promise<void> {
    const accountTitleService = new chevre.service.AccountTitle({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    let message = '';
    let errors: any = {};
    const { data } = await accountTitleService.search({
        project: { ids: [req.project.id] },
        codeValue: { $eq: req.params.id }
    });
    if (data.length === 0) {
        throw new Error('Subject Not Found');
    }
    const subject = data[0];

    if (req.method === 'POST') {
        // バリデーション
        validate(req);
        const validatorResult = await req.getValidationResult();
        errors = req.validationErrors(true);
        if (validatorResult.isEmpty()) {
            // 作品DB登録
            try {
                const subjectData = createSubjectFromBody(req);
                debug('saving an subject...', subjectData);
                await accountTitleService.update(subjectData);
                req.flash('message', '更新しました');
                res.redirect(req.originalUrl);

                return;
            } catch (error) {
                message = error.message;
            }
        }
    }
    const forms = {
        subjectClassificationCd: (_.isEmpty(req.body.subjectClassificationCd)) ?
            subject.inCodeSet?.inCodeSet?.codeValue : req.body.subjectClassificationCd,
        subjectClassificationName: (_.isEmpty(req.body.subjectClassificationName)) ?
            subject.inCodeSet?.inCodeSet?.name : req.body.subjectClassificationName,
        subjectCd: (_.isEmpty(req.body.subjectCd)) ?
            subject.inCodeSet?.codeValue : req.body.subjectCd,
        subjectName: (_.isEmpty(req.body.subjectName)) ?
            subject.inCodeSet?.name : req.body.subjectName,
        detailCd: (_.isEmpty(req.body.detailCd)) ?
            subject.codeValue : req.body.detailCd,
        detailName: (_.isEmpty(req.body.detailName)) ?
            subject.name : req.body.detailName
    };
    // 作品マスタ画面遷移
    debug('errors:', errors);
    res.render('subject/edit', {
        message: message,
        errors: errors,
        forms: forms
    });
}
function createSubjectFromBody(req: Request): chevre.factory.accountTitle.IAccountTitle {
    const body = req.body;

    return {
        project: req.project,
        typeOf: 'AccountTitle',
        codeValue: body.detailCd,
        name: body.detailName,
        inCodeSet: {
            project: req.project,
            typeOf: 'AccountTitle',
            codeValue: body.subjectCd,
            inCodeSet: {
                project: req.project,
                typeOf: 'AccountTitle',
                codeValue: body.subjectClassificationCd
            }
        }
    };
}
/**
 * 一覧データ取得API
 */
export async function getList(req: Request, res: Response): Promise<void> {
    try {
        const accountTitleService = new chevre.service.AccountTitle({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });

        const limit = Number(req.query.limit);
        const page = Number(req.query.page);
        const { data } = await accountTitleService.search({
            limit: limit,
            page: page,
            project: { ids: [req.project.id] },
            codeValue: (req.query.detailCd !== undefined && req.query.detailCd !== '')
                ? req.query.detailCd
                : undefined
        });
        res.json({
            success: true,
            count: (data.length === Number(limit))
                ? (Number(page) * Number(limit)) + 1
                : ((Number(page) - 1) * Number(limit)) + Number(data.length),
            results: data.map((g) => {
                return {
                    id: g.codeValue,
                    subjectClassificationCd: g.inCodeSet?.inCodeSet?.codeValue,
                    subjectClassificationName: g.inCodeSet?.inCodeSet?.name,
                    subjectCd: g.inCodeSet?.codeValue,
                    subjectName: g.inCodeSet?.name,
                    detailCd: g.codeValue,
                    detailName: g.name
                };
            })
        });
    } catch (error) {
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
    res.render('subject/index', {
    });
}
/**
 * 科目新規登録画面検証
 */
function validate(req: Request): void {
    // 科目分類コード
    let colName: string = '科目分類コード';
    req.checkBody('subjectClassificationCd', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('subjectClassificationCd', Message.Common.getMaxLengthHalfByte(colName, NAME_MAX_LENGTH_CODE))
        .len({ max: NAME_MAX_LENGTH_CODE });
    // 科目分類名称
    colName = '科目分類名称';
    req.checkBody('subjectClassificationName', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('subjectClassificationName', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA))
        .len({ max: NAME_MAX_LENGTH_NAME_JA });
    // 科目コード
    colName = '科目コード';
    req.checkBody('subjectCd', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('subjectCd', Message.Common.getMaxLengthHalfByte(colName, NAME_MAX_LENGTH_CODE))
        .len({ max: NAME_MAX_LENGTH_CODE });
    // 科目名称
    colName = '科目名称';
    req.checkBody('subjectName', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('subjectName', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA))
        .len({ max: NAME_MAX_LENGTH_NAME_JA });
    // 細目コード
    colName = '細目コード';
    req.checkBody('detailCd', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('detailCd', Message.Common.getMaxLengthHalfByte(colName, NAME_MAX_LENGTH_CODE))
        .len({ max: NAME_MAX_LENGTH_CODE });
    // 細目名称
    colName = '細目名称';
    req.checkBody('detailName', Message.Common.required.replace('$fieldName$', colName)).notEmpty();
    req.checkBody('detailName', Message.Common.getMaxLength(colName, NAME_MAX_LENGTH_NAME_JA))
        .len({ max: NAME_MAX_LENGTH_NAME_JA });
}
