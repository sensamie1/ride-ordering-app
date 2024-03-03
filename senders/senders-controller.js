const SenderModel = require('../models/sender-model');
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

const CreateSender = async (req, res) => {
  try {
    logger.info('[CreateSender] => Create sender process started.')
    const senderFromRequest = req.body

    const existingEmailSender = await SenderModel.findOne({ email: senderFromRequest.email });

    if (existingEmailSender) {
      return res.status(409).json({
        message: 'Sender already exists',
      });
    }
  
    const sender = await SenderModel.create({
      first_name: senderFromRequest.first_name,
      last_name: senderFromRequest.last_name,
      email: senderFromRequest.email,
      password: senderFromRequest.password,
      confirm_password: senderFromRequest.confirm_password
    });
  
    const token = await jwt.sign({ email: sender.email, _id: sender._id}, process.env.JWT_SECRET, { expiresIn: '1h' })

      // Send email verification link
      const verificationLink = `http://${process.env.HOST}:${process.env.PORT}/senders/verify-email?token=${token}`;
      const mailOptions = {
        from: process.env.EMAIL,
        to: sender.email,
        subject: 'Email Verification',
        text: `Click on this link to verify your email: ${verificationLink}`
      };
  
      // Send email using nodemailer
      await transporter.sendMail(mailOptions);
    

    logger.info('[CreateSender] => Create sender process done.')
    return res.status(201).json({
      message: 'Sender created successfully. Check your Email and verify to complete signup. Note: Verification link expires in 1hr.',
      sender,
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

const SenderVerifyEmail = async (req, res) => {
  try {
    logger.info('[SenderVerifyEmail] => Sender verify Email process started.')
    const token = req.query.token;

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          const verificationLink = `http://${process.env.HOST}:${process.env.PORT}/senders/resend-verification-email`
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

      const sender = await SenderModel.findById(decoded._id);
      if (!sender) {
        return res.status(404).json({
          message: 'Sender not found.'
        });
      }

      if (sender.isVerified == true) {
        return res.status(208).json({
          message: 'Email already verified.'
        });
      }
      
      // Update only the isVerified field
      await SenderModel.findByIdAndUpdate(decoded._id, { isVerified: true });

      logger.info('[SenderVerifyEmail] => Sender verify Email process done.')
      return res.status(200).json({
        message: 'Email verified successfully.',
        success: true,
        sender
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

const SenderReVerifyEmail = async (req, res) => {
  try {
    logger.info('[SenderVerifyEmail] => Sender verify Email process started.')
    const { email } = req.body;

    const sender = await SenderModel.findOne({ email });

    if (!sender) {
      return res.status(404).json({ message: 'Sender not found.', success: false });
    }

    const token = jwt.sign({ email: sender.email, _id: sender._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Send email verification link
    const verificationLink = `http://${process.env.HOST}:${process.env.PORT}/senders/verify-email?token=${token}`;
    const mailOptions = {
      from: process.env.EMAIL,
      to: sender.email,
      subject: 'Email Verification',
      text: `Click on this link to verify your email: ${verificationLink}`
    };

    // Send email using nodemailer
    await transporter.sendMail(mailOptions);

    logger.info('[SenderVerifyEmail] => Sender verify Email process done.')
    return res.status(200).json({ message: 'Verification email has been resent. Note: Verification link expires in 1hr.', success: true });
  } catch (error) {
    console.error('Resend verification email error:', error);
    return res.status(500).json({ message: 'Server error.', success: false });
  }
}

const SenderLogin = async (req, res) => {
  try {
    logger.info('[SenderLogin] => Sender login process started')
    const senderFromRequest = req.body

    const sender = await SenderModel.findOne({
      email: senderFromRequest.email,
    });
  
    if (!sender) {
      return res.status(404).json({
        message: 'Sender not found',
      }) 
    }
  
    const validPassword = await sender.isValidPassword(senderFromRequest.password)

    if (!validPassword) {
      return res.status(422).json({
        message: 'Email or password is not correct',
      }) 
    }

    if (!sender.isVerified) {
      const verificationLink = `http://${process.env.HOST}:${process.env.PORT}/senders/resend-verification-email`
      return res.status(403).json({
        message: `Email not verified. Check your Email for verification link or request a new one here - ${verificationLink}`,
        success: false
      })
    }
  
    const token = await jwt.sign({ email: sender.email, _id: sender._id}, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' })

    logger.info('[SenderLogin] => Sender login process done')
    return res.status(200).json({
      message: 'Sender login successful',
      sender,
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
  CreateSender,
  SenderVerifyEmail,
  SenderReVerifyEmail,
  SenderLogin
}