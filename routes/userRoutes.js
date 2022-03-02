const express = require('express');
const authController = require('../controllers/authController');
const userController = require('./../controllers/userController');
const router = express.Router();

router.route('/signup').post(authController.signup);
router.route('/login').post(authController.login);

// password resetting routes
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// protect all the following routes after this middleware
router.use(authController.protect);

// update the user password
router.patch('/updatePassword', authController.updatePassword);

// deactivate the user
router.get('/me', userController.getMe, userController.getUser);
router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);

router.use(authController.restrictTo('admin'))

router.route('/').get(userController.getAllUsers);

router
  .route('/:id')
  .get(userController.getUser)
  .delete(userController.deleteUser)
  .patch(userController.updateUser);

module.exports = router;
