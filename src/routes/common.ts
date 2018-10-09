/**
 * commonコントローラー
 */
import { Router } from 'express';

import * as CommomController from '../controllers/common';

const commonRouter = Router();

commonRouter.all('/complete', CommomController.complete);

export default commonRouter;
