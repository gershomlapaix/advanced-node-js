const AppError = require('./../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path} : ${err.value}`;
  return new AppError(message, 400);
};

const handleJwtError = () => {
  return new AppError('Invalid token. Please login again', 401);
};

const handleJwtExpiredError = () =>
  new AppError('Token expired. Please login again', 401);

const sendDevErr = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const sendProdErr = (err, res) => {
  // Operational, trusted error: send message to the client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

    // programming or other unknown error: we don't need error details
  } else {
    console.log('ERROR', err);

    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendDevErr(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    console.log(error);

    if (error.name === 'CastError') error = handleCastErrorDB(error);

    if (error.name === 'JsonWebTokenError') error = handleJwtError();

    if (error.name === 'TokenExpiredError') error = handleJwtExpiredError();

    sendProdErr(err, res);
  }
};
