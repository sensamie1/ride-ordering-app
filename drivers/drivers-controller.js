const DriverModel = require('../models/driver-model');
const jwt = require('jsonwebtoken');
const logger = require('../logger');
const nodemailer = require('nodemailer');

require('dotenv').config()

const transporter = nodemailer.createTransport({
  service: process.env.SERVICE,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD
  }
});

const CreateDriver = async (req, res) => {
  try {
    logger.info('[CreateDriver] => Create driver process started.')
    const driverFromRequest = req.body

    const existingEmailDriver = await DriverModel.findOne({ email: driverFromRequest.email });

    if (existingEmailDriver) {
      return res.status(409).json({
        message: 'Driver already exists',
      });
    }
  
    const driver = await DriverModel.create({
      first_name: driverFromRequest.first_name,
      last_name: driverFromRequest.last_name,
      vehicle_name: driverFromRequest.vehicle_name,
      vehicle_color: driverFromRequest.vehicle_color,
      email: driverFromRequest.email,
      password: driverFromRequest.password,
      confirm_password: driverFromRequest.confirm_password
    });
  
    const token = await jwt.sign({ email: driver.email, _id: driver._id}, process.env.JWT_SECRET, { expiresIn: '1h' })

    // Send email verification link
    const verificationLink = `http://${process.env.HOST}:${process.env.PORT}/drivers/verify-email?token=${token}`;
    const mailOptions = {
      from: process.env.EMAIL,
      to: driver.email,
      subject: 'Email Verification',
      text: `Click on this link to verify your email: ${verificationLink}`
    };

    // Send email using nodemailer
    await transporter.sendMail(mailOptions);


    logger.info('[CreateDriver] => Create driver process done.')
    return res.status(201).json({
      message: 'Driver created successfully. Check your Email and verify to complete signup.',
      driver,
      token
    }) 
  } catch (error) {
      console.log(error)
      return res.status(500).json({
        message: 'Server Error',
        data: null
      })
  }

}

const DriverVerifyEmail = async (req, res) => {
  try {
    logger.info('[DriverVerifyEmail] => Driver verify Email process started.')
    const token = req.query.token;

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          const verificationLink = `http://${process.env.HOST}:${process.env.PORT}/drivers/resend-verification-email`
          return res.status(410).json({
            message: `Verification link has expired. Please request a new verification link with your email here - ${verificationLink}.`,
            success: false
          });
        } else {
          return res.status(401).json({
            message: 'Invalid verification link.',
            success: false
          });
        }
      }

      const driver = await DriverModel.findById(decoded._id);
      if (!driver) {
        return res.status(404).json({
          message: 'Driver not found.'
        });
      }
      
      if (driver.isVerified == true) {
        return res.status(208).json({
          message: 'Email already verified.'
        });
      }
      
      // Update only the isVerified field
      await DriverModel.findByIdAndUpdate(decoded._id, { isVerified: true });

      logger.info('[DriverVerifyEmail] => Driver verify Email process done.')
      return res.status(200).json({
        message: 'Email verified successfully.',
        success: true,
        driver
      });

    });
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({
      message: 'Server error.',
      success: false
    });
  }
}

const DriverReVerifyEmail = async (req, res) => {
  try {
    logger.info('[DriverVerifyEmail] => Driver verify Email process started.')
    const { email } = req.body;

    const driver = await DriverModel.findOne({ email });

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found.', success: false });
    }

    const token = jwt.sign({ email: driver.email, _id: driver._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Send email verification link
    const verificationLink = `http://${process.env.HOST}:${process.env.PORT}/drivers/verify-email?token=${token}`;
    const mailOptions = {
      from: process.env.EMAIL,
      to: driver.email,
      subject: 'Email Verification',
      text: `Click on this link to verify your email: ${verificationLink}`
    };

    // Send email using nodemailer
    await transporter.sendMail(mailOptions);

    logger.info('[Driver VerifyEmail] => Driver verify Email process done.')
    return res.status(200).json({ message: 'Verification email has been resent.  Note: Verification link expires in 1hr.', success: true });
  } catch (error) {
    console.error('Resend verification email error:', error);
    return res.status(500).json({ message: 'Server error.', success: false });
  }
}

const DriverLogin = async (req, res) => {
  try {
    logger.info('[DriverLogin] => Driver login process started')
    const driverFromRequest = req.body

    const driver = await DriverModel.findOne({
      email: driverFromRequest.email,
    });
  
    if (!driver) {
      return res.status(404).json({
        message: 'Driver not found',
      }) 
    }

    if (!driver.isVerified) {
      const verificationLink = `http://${process.env.HOST}:${process.env.PORT}/drivers/resend-verification-email`
        return res.status(400).json({
          message: `Email not verified. Check your mail to verify or request a new verification link with your email here - ${verificationLink}.`,
          success: false
        }); 
    }
  
    const validPassword = await driver.isValidPassword(driverFromRequest.password)

    if (!validPassword) {
      return res.status(422).json({
        message: 'Email or password is not correct',
      }) 
    }
  
    const token = await jwt.sign({ email: driver.email, _id: driver._id}, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' })

    logger.info('[DriverLogin] => Driver login process done')
    return res.status(200).json({
      message: 'Driver login successful',
      driver,
      token
    })
  } catch (error) {
      logger.error(error.message);
      return res.status(500).json({
        message: 'Server Error',
        data: null
      })
  }
}


module.exports = {
  CreateDriver,
  DriverVerifyEmail,
  DriverReVerifyEmail,
  DriverLogin
}