/**
 * 映画作品コントローラー
 */
import { Router } from 'express';

import * as SubjectController from '../controllers/subject';

const subjectRouter = Router();

subjectRouter.all('/add', SubjectController.add);
subjectRouter.all('', SubjectController.index);
subjectRouter.all('/getlist', SubjectController.getList);
subjectRouter.all('/:id/update', SubjectController.update);

export default subjectRouter;
