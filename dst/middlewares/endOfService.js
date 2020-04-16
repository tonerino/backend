"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment = require("moment");
const ErrorController = require("../controllers/error");
const END_OF_SERVICE = process.env.END_OF_SERVICE;
exports.default = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const now = moment();
        if (typeof END_OF_SERVICE === 'string') {
            if (now.isSameOrAfter(moment(END_OF_SERVICE))) {
                ErrorController.badRequest(new Error('サービスは終了しました'), req, res);
                return;
            }
        }
        next();
    }
    catch (error) {
        next(error);
    }
});
