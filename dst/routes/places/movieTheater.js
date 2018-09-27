"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 劇場ルーター
 */
const chevre = require("@toei-jp/chevre-api-nodejs-client");
const express_1 = require("express");
const movieTheaterRouter = express_1.Router();
movieTheaterRouter.get('', (_, res) => {
    res.render('places/movieTheater/index', {
        message: ''
    });
});
movieTheaterRouter.get('/search', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        const placeService = new chevre.service.Place({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const { totalCount, data } = yield placeService.searchMovieTheaters({
            limit: req.query.limit,
            page: req.query.page,
            name: req.query.name
        });
        res.json({
            success: true,
            count: totalCount,
            results: data
        });
    }
    catch (err) {
        res.json({
            success: false,
            count: 0,
            results: []
        });
    }
}));
movieTheaterRouter.get('/getScreenListByTheaterBranchCode', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        const placeService = new chevre.service.Place({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const branchCode = req.query.branchCode;
        const place = yield placeService.findMovieTheaterByBranchCode({
            branchCode
        });
        const results = place.containsPlace.map((screen) => ({
            branchCode: screen.branchCode,
            name: screen.name !== undefined ? screen.name.ja : ''
        }));
        results.sort((screen1, screen2) => {
            if (screen1.name > screen2.name) {
                return 1;
            }
            if (screen1.name < screen2.name) {
                return -1;
            }
            return 0;
        });
        res.json({
            success: true,
            results
        });
    }
    catch (err) {
        res.json({
            success: false,
            results: []
        });
    }
}));
exports.default = movieTheaterRouter;
