const path = require('path');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

// security modules
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const app = express();

app.use(cors({credentials: true, origin: 'http://localhost:3000'}));
app.use(cookieParser());

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// GLOBAL MIDDLEWARES

// 5. Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// 1. Set security HTTP Headers : helmet
app.use(helmet());

// 2. Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 3. Implement rate limiting
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // 100 requests within 1h
  message: 'Too many requests from this IP, please try again in an hour',
});

app.use('/api', limiter); // apply rate-limiting to all routes starting with "api"

// 4. Body parser, readind data from body into req.body
app.use(express.json({ limit: '10kb' }));


// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'difficulty',
      'price',
    ], // allow duplicate fields
  })
);

// Test middlewares
app.use((req, res, next) => {
  console.log(req.cookies);
  next();
});

// Serving static files

app.use('/api/v1/tours', require('./routes/tourRoutes'));
app.use('/api/v1/users', require('./routes/userRoutes'));
app.use('/api/v1/reviews', require('./routes/reviewRoutes'));

// this will not run if request-response cycle ended in above routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
