const express = require('express');
const middleware = require('./senders-middleware')
const controller = require('./senders-controller')
const globalMiddleware = require('../middlewares/global-sender-middlewares')

const router = express.Router();


// Create Sender
router.post('/signup', globalMiddleware.checkBody, middleware.ValidateSenderCreation, controller.CreateSender)

// Verify Email
router.get('/verify-email', controller.SenderVerifyEmail);

// Resend verification email
router.post('/resend-verification-email', globalMiddleware.checkBody, controller.SenderReVerifyEmail);

// Signin Sender
router.post('/login', middleware.SenderLoginValidation, controller.SenderLogin)


module.exports = router
