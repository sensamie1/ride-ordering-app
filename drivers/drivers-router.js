const express = require('express');
const middleware = require('./drivers-middleware')
const controller = require('./drivers-controller')
const globalMiddleware = require('../middlewares/global-driver-middlewares')

const router = express.Router();


// Create Driver
router.post('/signup', globalMiddleware.checkBody, middleware.ValidateDriverCreation, controller.CreateDriver)

// Verify Email
router.get('/verify-email', controller.DriverVerifyEmail);

// Resend verification email
router.post('/resend-verification-email', globalMiddleware.checkBody, controller.DriverReVerifyEmail);

// Signin Driver
router.post('/login', globalMiddleware.checkBody, middleware.DriverLoginValidation, controller.DriverLogin)


module.exports = router
