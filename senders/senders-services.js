const SenderModel = require('../models/sender-model');
const DriverModel = require('../models/driver-model');
const OrderModel = require('../models/order-model');
const jwt = require('jsonwebtoken');
const logger = require('../logger');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt')



const transporter = nodemailer.createTransport({
  service: process.env.SERVICE,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD
  }
});


const CreateSender = async (sender) => {
  try {
    logger.info('[CreateSender] => Create sender process started...')
    const senderFromRequest = sender;

    const newSender = new SenderModel();

    newSender.first_name = senderFromRequest.first_name;
    newSender.last_name = senderFromRequest.last_name;
    newSender.email = senderFromRequest.email;
    newSender.password = senderFromRequest.password;
    newSender.confirm_password = senderFromRequest.confirm_password;

    const existingSender = await SenderModel.findOne({
      email: senderFromRequest.email,
    });

    if (existingSender) {
      return {
        message: 'Sender already exists.',
        code: 409
      }
    }

    const savedSender = await newSender.save();

    const token = await jwt.sign({ email: savedSender.email, _id: savedSender._id}, process.env.JWT_SECRET, { expiresIn: '1h' })

      // Send email verification link
      const verificationLink = `http://${process.env.HOST}:${process.env.PORT}/views/senders/verify-email?token=${token}`;
      
      const htmlContent = `
        <html>
          <head>
            <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f0f0f0;
              text-align: center;
            }
      
            .logo-image {
              display: block;
              width: 200px;
              height: auto;
              border-radius: 5px;
              margin-top: 20px;
            }
      
            button {
              background-color: #074e02ef;
              color: #fff;
              padding: 10px 20px;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              transition: background-color 0.3s ease;
            }
      
            button:hover {
              background-color: #599e54;
            }
      
            p {
              margin-top: 20px;
              font-size: 18px;
            }
      
            a {
              color: #fff;
              text-decoration: none;
            }
            </style>
          </head>
          <body>
            <img src="https://res.cloudinary.com/ddi6arl8i/image/upload/v1708028233/zcsdhd4zdnei8k6ol6f1.png" alt="Rider Logo" class="logo-image">
            <p><strong>Welcome to Rider App.</strong></p>
            <p>Your signup was successful.</p>
            <p>Click on this link to verify your email:</p>
            <button><a href="${verificationLink}" style="color: #fff;">Verify</a></button>
          </body>
        </html>
      `
      
      const mailOptions = {
        // from: 'Rider' || process.env.EMAIL,
        from: 'Rider',
        to: sender.email,
        subject: 'Email Verification',
        html: htmlContent
      };
  
      // Send email using nodemailer
      await transporter.sendMail(mailOptions);

    logger.info('[CreateSender] => Create sender process done.')
    return {
      code: 200,
      success: true,
      message: 'Sender created successfully',
      data: {
        sender: savedSender
      }
    }
  } catch (error) {
    console.log(error)
    return {
      message: 'Server Error',
      code: 500,
      data: null
    }}
}   

const SenderVerifyEmail = async (req, res) => {
  try {
    logger.info('[SenderVerifyEmail] => Sender verify Email process started.')
    const token = req.query.token;

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const sender = await SenderModel.findById(decoded._id);
    if (!sender) {
      return {
        message: 'Sender not found.',
        code: 404,
      };
    }
    if (sender.isVerified) {
      return {
        message: 'Email already verified.',
        code: 208
      };
    }

    // Update only the isVerified field
    await SenderModel.findByIdAndUpdate(decoded._id, { isVerified: true });

    logger.info('[SenderVerifyEmail] => Sender verify Email process done.')
    return {
      message: 'Email verified successfully.',
      code: 200
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return {
        message: 'Verification link has expired.',
        code: 401
      };
    } else {
      console.error('Error in verifying email:', error);
      return {
        message: 'Invalid verification link.',
        code: 410
      };
    }
  }
}

const SenderReVerifyEmail = async (email) => {
  try {
    logger.info('[SenderReverifyEmail] => Sender reverify Email process started.')
    const sender = await SenderModel.findOne({ email });

    if (!sender) {
      return {
        message: 'Sender not found.',
        code: 404, 
        success: false
      };
    }

    const token = await jwt.sign({ email: sender.email, _id: sender._id}, process.env.JWT_SECRET, { expiresIn: '1h' })

      // Send email verification link
      const verificationLink = `http://${process.env.HOST}:${process.env.PORT}/views/senders/verify-email?token=${token}`;
      
      const htmlContent = `
        <html>
          <head>
            <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f0f0f0;
              text-align: center;
            }
      
            .logo-image {
              display: block;
              width: 200px;
              height: auto;
              border-radius: 5px;
              margin-top: 20px;
            }
      
            button {
              background-color: #074e02ef;
              color: #fff;
              padding: 10px 20px;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              transition: background-color 0.3s ease;
            }
      
            button:hover {
              background-color: #599e54;
            }
      
            p {
              margin-top: 20px;
              font-size: 18px;
            }
      
            a {
              color: #fff;
              text-decoration: none;
            }
            </style>
          </head>
          <body>
            <img src="https://res.cloudinary.com/ddi6arl8i/image/upload/v1708028233/zcsdhd4zdnei8k6ol6f1.png" alt="Rider Logo" class="logo-image">
            <p><strong>Welcome to Rider App.</strong></p>
            <p>Your signup was successful.</p>
            <p>Click on this link to verify your email:</p>
            <button><a href="${verificationLink}" style="color: #fff;">Verify</a></button>
          </body>
        </html>
      `
      
      const mailOptions = {
        // from: 'Rider' || process.env.EMAIL,
        from: 'Rider',
        to: sender.email,
        subject: 'Email Verification',
        html: htmlContent
      };

    // Send email using nodemailer
    await transporter.sendMail(mailOptions);

    logger.info('[SenderReverifyEmail] => Sender reverify Email process done.')
    return {
      message: 'Verification email has been resent.', 
      code: 200,
      success: true 
    };
  } catch (error) {
    console.error('Resend verification email error:', error);
    return { 
      message: 'Server error.',
      code: 500, 
      success: false 
    };
  }
}


const SenderLogin = async ({ email, password }) => {
  try {
    logger.info('[SenderLogin] => Sender login process started...')
    const senderFromRequest = { email, password }

    const sender = await SenderModel.findOne({
      email: senderFromRequest.email
    });

    if (!sender) { 
      return {
        message: 'Sender not found',
        code: 404
      }
    }

    const validPassword = await sender.isValidPassword(senderFromRequest.password)

    if (!validPassword) {
      return {
        message: 'Email or password incorrect',
        code: 422,
      }
    }

    if (!sender.isVerified) {
      const verificationLink = `http://${process.env.HOST}:${process.env.PORT}/views/senders/resend-verification-email`
      return {
        message: `Email not verified. Check your Email for verification link or request a new one here - ${verificationLink}`,
        verificationLink,
        code: 403,
      }
    }
    
    const token = await jwt.sign({ 
      email: sender.email, 
      _id: sender._id,
      first_name: sender.first_name, 
      last_name: sender.last_name}, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' })
    logger.info('[SenderLogin] => Sender login process done.')
    return {
    message: 'Login successful',
    code: 200,
    data: {
      sender,
      token
    }
    }
  } catch (error) {
    logger.error(error.message);
      return{
        message: 'Server Error',
        data: null
      }
  }
  
}

const SenderForgotPassword = async (email) => {
  try {
    logger.info('[SenderForgotPassword] => Sender forgot password process started.')

    const sender = await SenderModel.findOne({ email });
  
    if (!sender) {
      return {
        message: 'Sender not found.',
        code: 404, 
        success: false
      };
    }
  
    const token = await jwt.sign({ email: sender.email, _id: sender._id}, process.env.JWT_SECRET, { expiresIn: '5m' })
  
      // Send email password reset link
      const resetLink = `http://${process.env.HOST}:${process.env.PORT}/views/senders/reset-password?token=${token}`;
      
      const htmlContent = `
        <html>
          <head>
            <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f0f0f0;
              text-align: center;
            }
      
            .logo-image {
              display: block;
              width: 200px;
              height: auto;
              border-radius: 5px;
              margin-top: 20px;
            }
      
            button {
              background-color: #074e02ef;
              color: #fff;
              padding: 10px 20px;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              transition: background-color 0.3s ease;
            }
      
            button:hover {
              background-color: #599e54;
            }
      
            p {
              margin-top: 20px;
              font-size: 18px;
            }
      
            a {
              color: #fff;
              text-decoration: none;
            }
            </style>
          </head>
          <body>
            <img src="https://res.cloudinary.com/ddi6arl8i/image/upload/v1708028233/zcsdhd4zdnei8k6ol6f1.png" alt="Rider Logo" class="logo-image">
            <p><strong>Password Reset.</strong></p>
            <p>You requested for password reset.</p>
            <p>Click on this link to change your password:</p>
            <button><a href="${resetLink}" style="color: #fff;">Reset</a></button>
            <p>If you did not request a password change, ignore this message. Password reset link expires in 5min.</p>
          </body>
        </html>
      `
      
      const mailOptions = {
        // from: 'Rider' || process.env.EMAIL,
        from: 'Rider',
        to: sender.email,
        subject: 'Password Reset',
        html: htmlContent
      };

    // Send email using nodemailer
    await transporter.sendMail(mailOptions);

    logger.info('[SenderForgotPassword] => Sender forgot password process done.')
    return {
      message: 'Password reset email has been resent.', 
      code: 200,
      success: true 
    };

  } catch (error) {
      console.error(error);
      return {
        message: 'Server Error',
        data: null
      };
    }
}

const SenderResetPassword = async (_id, newPassword) => {
  try {
    logger.info('[SenderResetPassword] => Sender reset password process started.')

    const sender = await SenderModel.findById(_id);
    if (!sender) {
      return {
        message: 'Sender not found.',
        code: 404,
      };
    }

    // Check if the new password is the same as the current password
    const isSamePassword = await bcrypt.compare(newPassword, sender.password);
    if (isSamePassword) {
      return {
        message: 'New password must be different from the current password.',
        code: 400,
      };
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update only the password field
    await SenderModel.findByIdAndUpdate(_id, { password: hashedPassword });

    logger.info('[SenderResetPassword] => Sender reset password process done.')
    return {
      message: 'Password changed successfully.',
      code: 200
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return {
        message: 'Password reset link has expired.',
        code: 401
      };
    } else {
      console.error('Password reset error:', error);
      return {
        message: 'Invalid reset link.',
        code: 410
      };
    }
  }
}

const SenderGetMyRides = async (senderId) => {
  try {
    logger.info('[SenderGetMyRides] => Sender get my rides process started...');

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // Find all orders associated with the sender's _id
    const orders = await OrderModel.find({ sender: senderId }).skip(skip).limit(limit);
    if (!orders) {
      return {
        message: 'Orders not found.',
        code: 404,
      };
    }

    // Fetch driver details for each order
    const rides = await Promise.all(orders.map(async (order) => {
      const driver = await DriverModel.findById(order.driver);
      return {
        current_location: order.current_location,
        destination: order.destination,
        price: order.price,
        driver: {
          first_name: driver.first_name,
          last_name: driver.last_name,
          vehicle_name: driver.vehicle_name,
          vehicle_color: driver.vehicle_color
        }
      };
    }));

    const totalCount = await OrderModel.countDocuments({senderId});


    const totalPages = Math.ceil(totalCount / limit);
    if (page > totalPages) {
      return {
        code: 200,
        message: 'No more pages',
        currentPage: page,
        totalPages: totalPages,
      }
    }
    
    logger.info('[SenderGetMyRides] => Sender get rides process done.');
    return {
      code: 200,
      message: 'Rides fetched successfully',
      rides,
      currentPage: page,
      totalPages: totalPages,
    }
  } catch (error) {
    return {
      code: 500,
      message: 'Server Error',
      data: null,
    }
  }
};

module.exports = {
  CreateSender,
  SenderVerifyEmail,
  SenderReVerifyEmail,
  SenderLogin,
  SenderForgotPassword,
  SenderResetPassword,
  SenderGetMyRides
}