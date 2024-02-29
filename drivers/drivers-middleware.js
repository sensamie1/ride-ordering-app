const joi = require('joi')
const logger = require('../logger');


const ValidateDriverCreation = async (req, res, next) => {
  try {
    logger.info('[ValidateDriverCreation] => Validate driver creation process started...');
    const schema = joi.object({
      first_name: joi.string().required(),
      last_name: joi.string().required(),
      vehicle_name: joi.string().required(),
      vehicle_color: joi.string().required(),
      email: joi.string().email().required(),
      password: joi.string().required(),
      confirm_password: joi.string().valid(joi.ref('password')).required()
        .messages({
          'any.only': 'Password does not match',
          'any.required': 'Confirm password is required'
        }),
    }).options({ allowUnknown: true }); // sets all unknown true (ignoring checks like terms)

    await schema.validateAsync(req.body, { abortEarly: true })

    logger.info('[ValidateDriverCreation] => Validate driver creation process done.');
    next()
  } catch (error) {
      return res.status(422).json({
        message: error.message,
        success: false
      })
  }
}

const DriverReverifyValidation = async (req, res, next) => {
  try {
    logger.info('[DriverReverifyValidation] => Driver Reverify validation process started...');
    const schema = joi.object({
      email: joi.string().email().required(),
    })

    await schema.validateAsync(req.body, { abortEarly: true })
    
    logger.info('[DriverReverifyValidation] => Driver Reverify validation process done.');
    next()
} catch (error) {
    return res.status(422).json({
      message: error.message,
      success: false
    })
  }
}

const DriverLoginValidation = async (req, res, next) => {
  try {
    logger.info('[DriverLoginValidation] => Driver login validation process started...');
    const schema = joi.object({
      email: joi.string().email().required(),
      password: joi.string().required(),
    })

    await schema.validateAsync(req.body, { abortEarly: true })
    
    logger.info('[DriverLoginValidation] => Driver login validation process done.');
    next()
} catch (error) {
    return res.status(422).json({
      message: error.message,
      success: false
    })
  }
}


const DriverForgotPasswordValidation = async (req, res, next) => {
  try {
    logger.info('[DriverForgotPasswordValidation] => Driver forgot password validation process started...');
    const schema = joi.object({
      email: joi.string().email().required(),
    })

    await schema.validateAsync(req.body, { abortEarly: true })
    
    logger.info('[DriverForgotPasswordValidation] => Driver forgot password validation process done.');
    next()
} catch (error) {
    return res.status(422).json({
      message: error.message,
      success: false
    })
  }
}



module.exports = {
  ValidateDriverCreation,
  DriverReverifyValidation,
  DriverLoginValidation,
  DriverForgotPasswordValidation
}