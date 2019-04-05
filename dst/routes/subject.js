"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 映画作品コントローラー
 */
const express_1 = require("express");
const SubjectController = require("../controllers/subject");
const subjectRouter = express_1.Router();
subjectRouter.all('/add', SubjectController.add);
subjectRouter.all('', SubjectController.index);
subjectRouter.all('/getlist', SubjectController.getList);
subjectRouter.all('/:id/update', SubjectController.update);
exports.default = subjectRouter;
