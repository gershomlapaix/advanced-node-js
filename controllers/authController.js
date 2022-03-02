const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const catchAsync = require('../utils/catchAsync');
const User = require('./../models/userModel');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

// token signing function
const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // cookies enabling
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, // can not be modified by the browser in any way
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  // res.cookie('jwt', token, cookieOptions).send(_.pick('_id', 'name', 'role'));
  res.cookie('jwt', token, cookieOptions);

  // remove the password from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res) => {
  // const newUser = await User.create(req.body);

  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
    active: req.body.active,
  });

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  /**
   * 1. check if the email and password exist
   * 2. check if the user exist & password is correct
   * 3. if everything ok, send token to the client
   * */

  // 1
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 2
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3
  createSendToken(user, 200, res);
});

// ///////////////////////////////////////////////////////////////////
// Only for rendered pages
exports.isLoggedIn = catchAsync(async (req, res, next) => {
  if (req.cookies.jwt) {
    // verify cookie
    const decoded = await promisify(jwt.verify)(
      req.cookies.jwt,
      process.env.JWT_SECRET
    );

    const freshUser = await User.findById(decoded.id);
    if (!freshUser) {
      res.clearCookie('jwt');
      return next();
    }

    // 4.
    if (freshUser.changePasswordAfter(decoded.iat)) {
      res.clearCookie('jwt');
      return next();
    }

    // THERE IS A LOGGED IN USER
    // createSendToken(freshUser, 200, res);
    req.user = decoded;
    next();
  } else {
    return res.status(401).send('Access denied...No token provided...');
  }
  next();
});

exports.protect = catchAsync(async (req, res, next) => {
  /**
   * 1. Getting token and check of it's there
   * 2. verification of the token
   * 3. check if the user still exists or password changed
   * 4. check if user changed password after the token has been issued
   */

  // 1.
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    // using cookies
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(new AppError('You are not logged in! Please login ', 401));
  }

  // 2.
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);

  // 3.
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError('The Token belonging to this user does no longer exist', 401)
    );
  }

  // 4.
  if (freshUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError(`User recently changed password! Please login again`, 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTES  
  req.user = freshUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You don't have permission to perform this action", 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  /**
   * 1. Get user based on the provided email
   * 2. Generate random reset token
   * 3. Send that token to the user email
   * */

  // 1.
  const email = req.body.email;

  if (!email) {
    return next(new AppError('Please provide email', 401));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError('No user with that email', 404));
  }

  // 2.
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3.
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with 
  your new password and passwordConfirm to : ${resetURL}\n If you didn't 
  forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token(valid for 10 min)',
    });

    res.status(200).json({
      status: 'success',
      resetToken,
      message: 'Token sent to email!',
    });
  } catch (err) {
    (user.passwordResetToken = undefined),
      (user.passwordResetExpires = undefined);
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  /**
   * 1. Get user based on the token
   * 2. If token has not expired, and there is user, set the new passwor
   * 3. update changedPasswordAt property for the user
   * 4. Log the user in, send JWT
   * */

  // 1.
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2.
  if (!user) {
    return next(new AppError('Token has already expired', 400));
  }
  // else
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3.
  // 4.

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  /**
   * 1. Get the user from the collection based on the currently logged in user
   * 2. check if the inserted password is correct
   * 3. if so, update the password
   * 4. Log user in, send JWT
   * */

  // 1.

  const user = await User.findById(req.user.id).select('+password');

  // 2.
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  // 3.
  user.passwordConfirm = req.body.passwordConfirm;
  user.password = req.body.password;
  await user.save();

  // 4.
  createSendToken(user, 200, res);
});
