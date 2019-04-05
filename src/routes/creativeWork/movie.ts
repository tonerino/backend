/**
 * 映画作品コントローラー
 */
import { Router } from 'express';

import * as MovieController from '../../controllers/creativeWork/movie';

const movieRouter = Router();

movieRouter.all('/add', MovieController.add);
movieRouter.all('', MovieController.index);
movieRouter.all('/getlist', MovieController.getList);
movieRouter.all('/:identifier/update', MovieController.update);

export default movieRouter;
