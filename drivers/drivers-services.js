const DriverModel = require('../models/driver-model');
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


const CreateDriver = async (driver) => {
  try {
    logger.info('[CreateDriver] => Create driver process started...')
    const driverFromRequest = driver;

    const newDriver = new DriverModel();

    newDriver.first_name = driverFromRequest.first_name;
    newDriver.last_name = driverFromRequest.last_name;
    newDriver.vehicle_name = driverFromRequest.vehicle_name;
    newDriver.vehicle_color = driverFromRequest.vehicle_color;
    newDriver.email = driverFromRequest.email;
    newDriver.password = driverFromRequest.password;
    newDriver.confirm_password =driverFromRequest.confirm_password;

    const existingDriver = await DriverModel.findOne({
      email: driverFromRequest.email,
    });

    if (existingDriver) {
      return {
        message: 'Driver already exists.',
        code: 409
      }
    }

    const savedDriver = await newDriver.save();

    const token = await jwt.sign({ email: savedDriver.email, _id: savedDriver._id}, process.env.JWT_SECRET, { expiresIn: '1h' })

      // Send email verification link
      const verificationLink = `http://${process.env.HOST}:${process.env.PORT}/views2/drivers/verify-email?token=${token}`;
      
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
            <p>Your signup as a driver was successful.</p>
            <p>Click on this link to verify your email:</p>
            <button><a href="${verificationLink}" style="color: #fff;">Verify</a></button>
          </body>
        </html>
      `
      
      const mailOptions = {
        // from: 'Rider' || process.env.EMAIL,
        from: 'Rider',
        to: driver.email,
        subject: 'Driver Email Verification',
        html: htmlContent
      };
  
      // Send email using nodemailer
      await transporter.sendMail(mailOptions);

    logger.info('[CreateDriver] => Create driver process done.')
    return {
      code: 200,
      success: true,
      message: 'Driver created successfully',
      data: {
        driver: savedDriver
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

const DriverVerifyEmail = async (req, res) => {
  try {
    logger.info('[DriverVerifyEmail] => Driver verify Email process started.')
    const token = req.query.token;

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const driver = await DriverModel.findById(decoded._id);
    if (!driver) {
      return {
        message: 'Driver not found.',
        code: 404,
      };
    }
    if (driver.isVerified) {
      return {
        message: 'Email already verified.',
        code: 208
      };
    }

    // Update only the isVerified field
    await DriverModel.findByIdAndUpdate(decoded._id, { isVerified: true });

    logger.info('[DriverVerifyEmail] => Driver verify Email process done.')
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

const DriverReVerifyEmail = async (email) => {
  try {
    logger.info('[DriverReverifyEmail] => Driver reverify Email process started.')
    const driver = await DriverModel.findOne({ email });

    if (!driver) {
      return {
        message: 'Driver not found.',
        code: 404, 
        success: false
      };
    }

    const token = await jwt.sign({ email: driver.email, _id: driver._id}, process.env.JWT_SECRET, { expiresIn: '1h' })

      // Send email verification link
      const verificationLink = `http://${process.env.HOST}:${process.env.PORT}/views2/drivers/verify-email?token=${token}`;
      
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
            <p>Your signup as a driver was successful.</p>
            <p>Click on this link to verify your email:</p>
            <button><a href="${verificationLink}" style="color: #fff;">Verify</a></button>
          </body>
        </html>
      `
      
      const mailOptions = {
        // from: 'Rider' || process.env.EMAIL,
        from: 'Rider',
        to: driver.email,
        subject: 'Driver Email Verification',
        html: htmlContent
      };

    // Send email using nodemailer
    await transporter.sendMail(mailOptions);

    logger.info('[DriverReverifyEmail] => Driver reverify Email process done.')
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


const DriverLogin = async ({ email, password }) => {
  try {
    logger.info('[DriverLogin] => Driver login process started...')
    const driverFromRequest = { email, password }

    const driver = await DriverModel.findOne({
      email: driverFromRequest.email
    });

    if (!driver) { 
      return {
        message: 'Driver not found',
        code: 404
      }
    }

    const validPassword = await driver.isValidPassword(driverFromRequest.password)

    if (!validPassword) {
      return {
        message: 'Email or password incorrect',
        code: 422,
      }
    }

    if (!driver.isVerified) {
      const verificationLink = `http://${process.env.HOST}:${process.env.PORT}/views2/drivers/resend-verification-email`
      return {
        message: `Email not verified. Check your Email for verification link or request a new one here - ${verificationLink}`,
        verificationLink,
        code: 403,
      }
    }
    
    const token = await jwt.sign({ 
      email: driver.email, 
      _id: driver._id,
      first_name: driver.first_name, 
      last_name: driver.last_name, 
      vehicle_name: driver.vehicle_name, 
      vehicle_color: driver.vehicle_color,}, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' })
    logger.info('[DriverLogin] => Driver login process done.')
    return {
    message: 'Login successful',
    code: 200,
    data: {
      driver,
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

const DriverForgotPassword = async (email) => {
  try {
    logger.info('[DriverForgotPassword] => Driver forgot password process started.')

    const driver = await DriverModel.findOne({ email });
  
    if (!driver) {
      return {
        message: 'Driver not found.',
        code: 404, 
        success: false
      };
    }
  
    const token = await jwt.sign({ email: driver.email, _id: driver._id}, process.env.JWT_SECRET, { expiresIn: '5m' })
  
      // Send email password reset link
      const resetLink = `http://${process.env.HOST}:${process.env.PORT}/views2/drivers/reset-password?token=${token}`;
      
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
            <p><strong>Driver Password Reset.</strong></p>
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
        to: driver.email,
        subject: 'Driver Password Reset',
        html: htmlContent
      };

    // Send email using nodemailer
    await transporter.sendMail(mailOptions);

    logger.info('[DriverForgotPassword] => Driver forgot password process done.')
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

const DriverResetPassword = async (_id, newPassword) => {
  try {
    logger.info('[DriverResetPassword] => Driver reset password process started.')

    const driver = await DriverModel.findById(_id);
    if (!driver) {
      return {
        message: 'Driver not found.',
        code: 404,
      };
    }

    // Check if the new password is the same as the current password
    const isSamePassword = await bcrypt.compare(newPassword, driver.password);
    if (isSamePassword) {
      return {
        message: 'New password must be different from the current password.',
        code: 400,
      };
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update only the password field
    await DriverModel.findByIdAndUpdate(_id, { password: hashedPassword });

    logger.info('[DriverResetPassword] => Driver reset password process done.')
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

module.exports = {
  CreateDriver,
  DriverVerifyEmail,
  DriverReVerifyEmail,
  DriverLogin,
  DriverForgotPassword,
  DriverResetPassword
}