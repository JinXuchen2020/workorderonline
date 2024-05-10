import express, { Request, Response, NextFunction,ErrorRequestHandler } from 'express';
import createError from 'http-errors';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import logger from'morgan';
import routes from './routes';

const app = express();

// view engine setup
app.set('views', 'views');
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(cookieParser());
app.use(express.static('public'));
app.use(cors());

app.use(routes);

// catch 404 and forward to error handler
app.use((req: Request, res: Response, next)=> {
  next(createError(404));
});

// error handler
app.use((err:any, req : Request, res : Response) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});  

export default app;
