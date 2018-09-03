/**
 * expressアプリケーション
 */
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as cors from 'cors';
import * as express from 'express';
// tslint:disable-next-line:no-require-imports
import expressValidator = require('express-validator');
import * as helmet from 'helmet';
import * as multer from 'multer';
import * as favicon from 'serve-favicon';
// tslint:disable-next-line:no-var-requires no-require-imports
const expressLayouts = require('express-ejs-layouts');

// ミドルウェア
import errorHandler from './middlewares/errorHandler';
import locals from './middlewares/locals';
import notFoundHandler from './middlewares/notFoundHandler';
import session from './middlewares/session';

// ルーター
import router from './routes/router';

const app = express();

app.use(cors()); // enable All CORS Requests
app.use(helmet());
app.use(session); // セッション
app.use(locals); // テンプレート変数

// view engine setup
app.set('views', `${__dirname}/../views`);
app.set('view engine', 'ejs');
app.use(expressLayouts);
// app.set('layout extractScripts', true);
// tslint:disable-next-line:no-backbone-get-set-outside-model
app.set('layout', 'layouts/layout');

// uncomment after placing your favicon in /public
app.use(favicon(`${__dirname}/../public/favicon.ico`));
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ limit: '1mb', extended: true }));

// for parsing multipart/form-data
const storage = multer.memoryStorage();
app.use(multer({ storage: storage }).any());

app.use(cookieParser());
app.use(express.static(`${__dirname}/../public`));

app.use(expressValidator()); // バリデーション

app.use(router);

// 404
app.use(notFoundHandler);

// error handlers
app.use(errorHandler);

export = app;
