"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * デフォルトルーター
 */
const express = require("express");
const authentication_1 = require("../middlewares/authentication");
const auth_1 = require("./auth");
const movie_1 = require("./creativeWork/movie");
const screeningEvent_1 = require("./event/screeningEvent");
const screeningEventSeries_1 = require("./event/screeningEventSeries");
const movieTheater_1 = require("./places/movieTheater");
const reservations_1 = require("./reservations");
const ticketType_1 = require("./ticketType");
const ticketTypeGroup_1 = require("./ticketTypeGroup");
const router = express.Router();
router.use(auth_1.default);
router.use(authentication_1.default);
router.use('/creativeWorks/movie', movie_1.default);
router.use('/events/screeningEvent', screeningEvent_1.default);
router.use('/events/screeningEventSeries', screeningEventSeries_1.default);
router.use('/places/movieTheater', movieTheater_1.default);
router.use('/reservations', reservations_1.default);
router.use('/ticketTypes', ticketType_1.default);
router.use('/ticketTypeGroups', ticketTypeGroup_1.default);
router.get('/', (req, res, next) => {
    if (req.query.next !== undefined) {
        next(new Error(req.param('next')));
        return;
    }
    res.redirect('/creativeWorks/movie');
});
exports.default = router;
