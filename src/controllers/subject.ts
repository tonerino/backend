/**
 * 科目コントローラー
 */
import * as chevre from '@toei-jp/chevre-api-nodejs-client';
import * as createDebug from 'debug';
import { Request, Response } from 'express';
import * as _ from 'underscore';

import * as Message from '../common/Const/Message';

const debug = createDebug('chevre-backend:controllers');

// 作品コード 半角64
const NAME_MAX_LENGTH_CODE: number = 64;
// 作品名・日本語 全角64
const NAME_MAX_LENGTH_NAME_JA: number = 64;
// 作品名・英語 半角128
// const NAME_MAX_LENGTH_NAME_EN: number = 128;
// 上映時間・数字10
// const NAME_MAX_LENGTH_NAME_MINUTES: number = 10;

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
                const subject = createSubjectFromBody(req.body);
                debug('saving an subject...', subject);
                const subjectService = new chevre.service.Subject({
                    endpoint: <string>process.env.API_ENDPOINT,
                    auth: req.user.authClient
                });
                await subjectService.createSubject({
                    attributes: subject
                });
                res.redirect('/complete');

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
    const subjectService = new chevre.service.Subject({
        endpoint: <string>process.env.API_ENDPOINT,
        auth: req.user.authClient
    });
    let message = '';
    let errors: any = {};
    const subject = await subjectService.findSubjectById({
        id: req.params.id
    });
    if (req.method === 'POST') {
        // バリデーション
        validate(req);
        const validatorResult = await req.getValidationResult();
        errors = req.validationErrors(true);
        if (validatorResult.isEmpty()) {
            // 作品DB登録
            try {
                const subjectData = createSubjectFromBody(req.body);
                debug('saving an subject...', subjectData);
                await subjectService.updateSubject({
                    id: req.params.id,
                    attributes: subjectData
                });
                res.redirect(req.originalUrl);

                return;
            } catch (error) {
                message = error.message;
            }
        }
    }
    const forms = {
        subjectClassificationCd: (_.isEmpty(req.body.subjectClassificationCd)) ?
            subject.subjectClassificationCd : req.body.subjectClassificationCd,
        subjectClassificationName: (_.isEmpty(req.body.subjectClassificationName)) ?
            subject.subjectClassificationName : req.body.subjectClassificationName,
        subjectCd: (_.isEmpty(req.body.subjectCd)) ?
            subject.subjectCd : req.body.subjectCd,
        subjectName: (_.isEmpty(req.body.subjectName)) ?
            subject.subjectName : req.body.subjectName,
        detailCd: (_.isEmpty(req.body.detailCd)) ?
            subject.detailCd : req.body.detailCd,
        detailName: (_.isEmpty(req.body.detailName)) ?
            subject.detailName : req.body.detailName
    };
    // 作品マスタ画面遷移
    debug('errors:', errors);
    res.render('subject/edit', {
        message: message,
        errors: errors,
        forms: forms
    });
}
function createSubjectFromBody(
    body: chevre.factory.subject.ISubjectAttributes
): chevre.factory.subject.ISubjectAttributes {
    return {
        subjectClassificationCd: body.subjectClassificationCd,
        subjectClassificationName: body.subjectClassificationName,
        subjectCd: body.subjectCd,
        subjectName: body.subjectName,
        detailCd: body.detailCd,
        detailName: body.detailName
    };
}
/**
 * 一覧データ取得API
 */
export async function getList(req: Request, res: Response): Promise<void> {
    try {
        const subjectService = new chevre.service.Subject({
            endpoint: <string>process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const { totalCount, data } = await subjectService.searchSubject({
            limit: req.query.limit,
            page: req.query.page,
            detailCd: req.query.detailCd
        });
        res.json({
            success: true,
            count: totalCount,
            results: data.map((g) => {
                return {
                    id: g.id,
                    subjectClassificationCd: g.subjectClassificationCd,
                    subjectClassificationName: g.subjectClassificationName,
                    subjectCd: g.subjectCd,
                    subjectName: g.subjectName,
                    detailCd: g.detailCd,
                    detailName: g.detailName
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
        subjectModel: {}
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
