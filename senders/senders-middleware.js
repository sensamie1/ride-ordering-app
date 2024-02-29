const joi = require('joi')
const logger = require('../logger');


const ValidateSenderCreation = async (req, res, next) => {
  try {
    logger.info('[ValidateSenderCreation] => Validate sender creation process started...');
    const schema = joi.object({
      first_name: joi.string().required(),
      last_name: joi.string().required(),
      email: joi.string().email().required(),
      password: joi.string().required(),
      confirm_password: joi.string().valid(joi.ref('password')).required()
      .messages({
        'any.only': 'Password does not match',
        'any.required': 'Confirm password is required'
      }),
    }).options({ allowUnknown: true }); // sets all unknown true (ignoring checks like terms)

    await schema.validateAsync(req.body, { abortEarly: true })

    logger.info('[ValidateSenderCreation] => Validate sender creation process done.');
    next()
  } catch (error) {
      return res.status(422).json({
        message: error.message,
        success: false
      })
  }
}

const SenderReverifyValidation = async (req, res, next) => {
  try {
    logger.info('[SenderReverifyValidation] => Sender Reverify validation process started...');
    const schema = joi.object({
      email: joi.string().email().required(),
    })

    await schema.validateAsync(req.body, { abortEarly: true })
    
    logger.info('[SenderLoginValidation] => Sender Reverify validation process done.');
    next()
} catch (error) {
    return res.status(422).json({
      message: error.message,
      success: false
    })
  }
}

const SenderLoginValidation = async (req, res, next) => {
  try {
    logger.info('[SenderLoginValidation] => Sender login validation process started...');
    const schema = joi.object({
      email: joi.string().email().required(),
      password: joi.string().required(),
    })

    await schema.validateAsync(req.body, { abortEarly: true })
    
    logger.info('[SenderLoginValidation] => Sender login validation process done.');
    next()
} catch (error) {
    return res.status(422).json({
      message: error.message,
      success: false
    })
  }
}

const SenderForgotPasswordValidation = async (req, res, next) => {
  try {
    logger.info('[SenderForgotPasswordValidation] => Sender forgot password validation process started...');
    const schema = joi.object({
      email: joi.string().email().required(),
    })

    await schema.validateAsync(req.body, { abortEarly: true })
    
    logger.info('[SenderForgotPasswordValidation] => Sender forgot password validation process done.');
    next()
} catch (error) {
    return res.status(422).json({
      message: error.message,
      success: false
    })
  }
}


module.exports = {
  ValidateSenderCreation,
  SenderReverifyValidation,
  SenderLoginValidation,
  SenderForgotPasswordValidation
}