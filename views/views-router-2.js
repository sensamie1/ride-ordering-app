const express = require('express');
const driverService = require('../drivers/drivers-services');
const driverMiddleware = require('../drivers/drivers-middleware');
// const DriverModel = require('../models/driver-model');
const SenderModel = require('../models/sender-model');
const OrderModel = require('../models/order-model');

const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

require('dotenv').config();

const router = express.Router();

router.use(cookieParser())

router.use(express.static('./views'));


// /views2/drivers/welcome (welcome page)
router.get('/', (req, res) => {
  // If the driver is already logged in, redirect to the home page
  if (req.cookies.driver_jwt) {
    res.redirect('/views2/drivers/driver-home');
} else {
    res.render('drivers-welcome', { driver: res.locals.driver, });
  }
})


// /views2/drivers/welcome (welcome page)
router.get('/drivers', (req, res) => {
  // If the driver is already logged in, redirect to the home page
  if (req.cookies.driver_jwt) {
    res.redirect('/views2/drivers/driver-home');
} else {
    res.render('drivers-welcome', { driver: res.locals.driver, });
  }
})

// /views2/drivers/welcome (welcome page)
router.get('/welcome', (req, res) => {
  // If the driver is already logged in, redirect to the home page
  if (req.cookies.driver_jwt) {
    res.redirect('/views2/drivers/driver-home');
} else {
    res.render('drivers-welcome', { driver: res.locals.driver, });
  }
})


// /views2/drivers/welcome (welcome page)
router.get('/drivers/welcome', (req, res) => {
  // If the driver is already logged in, redirect to the home page
  if (req.cookies.driver_jwt) {
    res.redirect('driver-home');
} else {
    res.render('drivers-welcome', { driver: res.locals.driver, });
  }
})


// /views2/drivers/terms (terms page)
router.get('/drivers/terms', (req, res) => {
  // If the driver is already logged in, redirect to the auth-drivers-terms page
  if (req.cookies.driver_jwt) {
    res.redirect('auth-drivers-terms');
} else {
    res.render('drivers-terms', { driver: res.locals.driver, });
  }
})


// /views2/drivers/signup (signup page)
router.get('/drivers/signup', (req, res) => {
  // If the driver is already logged in, redirect to the home page
  if (req.cookies.driver_jwt) {
    res.redirect('driver-home');
} else {
    res.render('drivers-signup', { driver: res.locals.driver || null,  messages: req.flash() });
  }
})


// /views2/drivers/signup (drivers signup post request)
router.post('/drivers/signup', driverMiddleware.ValidateDriverCreation, async (req, res) => {
  const response = await driverService.CreateDriver(req.body);
  if (response.code === 200) {
    req.flash('success', 'Driver signup successful. Check your E-mail for verification, then you can login.');
    res.redirect('signup');
  } else if (response.code === 409) {
    req.flash('error', 'Driver already exists. You can login or check your E-mail for verification.');
    res.redirect('signup');
  } else {
    req.flash('error', response.message);
    res.redirect('drivers-404');
  }
});



// /views2/drivers/verify-email (verification page)
router.get('/drivers/verify-email', async (req, res) => {
  const response = await driverService.DriverVerifyEmail(req, res)
  console.log(response);
  if (response.code === 200) {
    res.render('driver-email-verify-success', { driver: res.locals.driver});
  } else if (response.code === 208) {
    res.render('driver-email-already-verified', { driver: res.locals.driver});
  } else if (response.code === 401 || 410) {
    res.render('driver-email-verify-failed', { driver: res.locals.driver});
  } else if (response.code === 404){
    res.render('driver-email-verify-not-found', { driver: res.locals.driver});
  } else {
    res.render('drivers-404', { error: response.message })
  }
})



// /views2/drivers/resend-verification-email (reverify page)
router.get('/drivers/resend-verification-email', (req, res) => {
  // If the driver is already logged in, redirect to the home page
  if (req.cookies.driver_jwt) {
    res.redirect('driver-home');
} else {
    res.render('driver-reverify-email', { driver: res.locals.driver || null,  messages: req.flash() });
  }
})


// /views2/drivers/resend-verification-email (reverify post request)
router.post('/drivers/resend-verification-email', driverMiddleware.DriverReverifyValidation, async (req, res) => {
  const { email } = req.body;
  const response = await driverService.DriverReVerifyEmail(email);
  if (response.code === 200) {
    req.flash('success', 'Verification Email has been resent. Check your Email for verification, then you can login.');
    res.redirect('login');
  } else if (response.code === 404) {
    req.flash('error', 'Driver not found. Signup to create an account.');
    res.redirect('signup');
  } else {
    req.flash('error', response.message);
    res.redirect('drivers-404');
  }
});



// // /views2/drivers/login (login page)
// router.get('/drivers/login', (req, res) => {
//   // If the driver is already logged in, redirect to the home page
//   if (req.cookies.driver_jwt) {
//     res.redirect('driver-home');
// } else {
//     res.render('drivers-login', { driver: res.locals.driver || null, messages: req.flash() });
//   }
// })


// /views/drivers/login (login page)
router.get('/drivers/login', (req, res) => {
  // Check if the driver JWT token exists in cookies
  if (req.cookies.driver_jwt) {
    // Decode the JWT token to check its expiration
    const token = req.cookies.driver_jwt;
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      if (err) {
        // If there's an error verifying the token, clear it from cookies
        res.clearCookie('driver_jwt');
        console.error('Error verifying token:', err);
        // Redirect to login page or handle the error as appropriate
        res.redirect('/views2/drivers/login');
      } else {
        // Token is valid, check if it's expired
        if (decodedToken.exp * 1000 < Date.now()) {
          // If the token has expired, clear it from cookies
          res.clearCookie('driver_jwt');
          // Redirect to login page
          res.redirect('/views2/drivers/login');
        } else {
          // If the token is still valid, redirect to the home page
          res.redirect('driver-home');
          return;
        }
      }
    });
  }

  // If the driver JWT token doesn't exist or has expired, render the login page
  res.render('drivers-login', { driver: res.locals.driver || null, messages: req.flash() });
});




// /views2/drivers/login (login post request)
router.post('/drivers/login', driverMiddleware.DriverLoginValidation, async (req, res) => {
  const response = await driverService.DriverLogin({ email: req.body.email, password: req.body.password })
  if (response.code === 200) {
    // set cookie
    res.cookie('driver_jwt', response.data.token, {maxAge: 1 * 24 * 60 * 60 * 1000})
    res.redirect('driver-home')
  } else if (response.code === 403) {
    res.render('driver-email-not-verified', { driver: res.locals.driver})
  } else if (response.code === 404) {
    req.flash('error', 'Sorry, the driver details provided are invalid. Please check the details and try again.');
    res.redirect('login')
  }else if (response.code === 422) {
    req.flash('error', 'Sorry, the email or password provided is incorrect. Please check your login details and try again.');
    res.redirect('login')
  }else {
    res.render('drivers-404', { error: response.message })
  }
});



// /views/drivers/forgot-password (forgot-password page)
router.get('/drivers/forgot-password', (req, res) => {
  // If the driver is already logged in, redirect to the home page
  if (req.cookies.driver_jwt) {
    res.redirect('driver-home');
} else {
    res.render('driver-forgot-password', { driver: res.locals.driver || null, messages: req.flash() });
  }
})


// /views/drivers/forgot-password (forgot-password post request)
router.post('/drivers/forgot-password', driverMiddleware.DriverForgotPasswordValidation, async (req, res) => {
  const { email } = req.body;
  const response = await driverService.DriverForgotPassword(email)
  if (response.code === 200) {
    req.flash('success', 'Password reset email has been resent. Check you Email to change your password.');
    res.redirect('forgot-password')
  } else if (response.code === 404) {
    req.flash('error', 'Driver not found. Please check the Email input and try again.');
    res.redirect('forgot-password')
  }else {
    res.render('drivers-404', { error: response.message })
  }
});



// /views/drivers/reset-password (reset-password page)
router.get('/drivers/reset-password', (req, res) => {
  // If the driver is already logged in, redirect to the home page
  if (req.cookies.driver_jwt) {
    return res.redirect('driver-home');
  }
  const token = req.query.token || req.cookies.driver_password_jwt;
  if (!token) {
    req.flash('error', 'Reset token is missing.');
    return res.redirect('forgot-password');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded);
    // Token is valid
    // Set JWT token in the cookie
    res.cookie('driver_password_jwt', token, { maxAge: 5 * 60 * 1000, httpOnly: true });
    // Pass driver information to the reset password page
    res.render('driver-reset-password', { driver: res.locals.driver || null, token: req.query.token, messages: req.flash() });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      // Token has expired
      req.flash('error', 'Password reset link has expired.');
      return res.redirect('forgot-password');
    } else {
      // Other token verification errors
      console.error('Error verifying token:', error);
      req.flash('error', 'Invalid reset token.');
      return res.redirect('forgot-password');
    }
  }
});

// /views/drivers/reset-password (reset-password post request)
router.post('/drivers/reset-password', async (req, res) => {
  try {
    const token = req.cookies.driver_password_jwt; // Access JWT token from cookie

    const newPassword = req.body.password;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const response = await driverService.DriverResetPassword(decoded._id, newPassword);
    console.log(response);
    if (response.code === 200) {
      req.flash('success', 'Password changed successfully. You can now login with your new password.');
      res.clearCookie('driver_password_jwt');
      res.redirect('login');
    } else if (response.code === 400) {
      req.flash('error', 'New password must be different from the current password.')
      res.redirect('reset-password')
    } else if (response.code === 410 || response.code === 401) {
      req.flash('error', 'Invalid or expired reset link. Please try again.');
      res.redirect('forgot-password');
    } else if (response.code === 404) {
      req.flash('error', 'Driver not found. Please try again.');
      res.redirect('forgot-password');
    } else {
      res.render('drivers-404', { error: response.message });
    }
  } catch (error) {
    console.error('Error resetting password:', error);
    req.flash('error', 'An error occurred while resetting the password. Please try again.');
    res.redirect('forgot-password');
  }
});




// PROTECTED ROUTE
router.use(async (req, res, next) => {

  const token = req.cookies.driver_jwt;

  if (token) {
      try {
        const decodedValue = await jwt.verify(token, process.env.JWT_SECRET);
      
        res.locals.driver = decodedValue;

        next()
      } catch (error) {
        res.redirect('login')
      }
  } else {
      res.redirect('login')
  }
})


// /views2/drivers/logout
router.get('/drivers/logout', (req, res) => {    
  res.clearCookie('driver_jwt')
  res.redirect('login')
});



// /views2/drivers/home (driver logged in)
router.get('/drivers/driver-home', (req, res) => {
  console.log({ driver: res.locals.driver })
  res.render('driver-home', { driver: res.locals.driver });
})



// /views2/drivers/auth-drivers-terms (driver logged in)
router.get('/drivers/auth-drivers-terms', (req, res) => {
  console.log({ driver: res.locals.driver })
  res.render('auth-drivers-terms', { driver: res.locals.driver });
})


// for socketIO book ride
router.get('/drivers/available-trips', (req, res) => {
  // console.log({ driver: res.locals.driver })
  res.render('driver-available-trips', { driver: res.locals.driver });
})


// Route to fetch driver's trips with pagination
router.get('/drivers/my-trips', async (req, res) => {
  try {
    // Get the driver's JWT token from the cookie
    const token = req.cookies.driver_jwt;

    // Decode the driver's JWT to get the driver's _id
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const driverId = decodedToken._id;

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // Find orders associated with the sender's _id with pagination
    const orders = await OrderModel.find({ driver: driverId })
      .sort({ created_at: -1 }) // Sort by order_date in descending order
      .skip(skip)
      .limit(limit);
    const totalCount = await OrderModel.countDocuments({ driver: driverId });


    // Fetch driver details for each order
    const rides = await Promise.all(orders.map(async (order) => {
      const sender = await SenderModel.findById(order.sender);
      return {
        current_location: order.current_location,
        destination: order.destination,
        price: order.price,
        status: order.status,
        created_at: order.created_at,
        sender: {
          first_name: sender.first_name,
          last_name: sender.last_name,
        }
      };
    }));

    if (orders.length === 0) {
      req.flash('error', 'Trips not found. You have not completed any trip.')
      res.render('driver-trips', {
        driver: res.locals.driver || null,
        rides: rides,
        currentPage: page,
        pages: Math.ceil(totalCount / limit)
      });
    } else {
        res.render('driver-trips', {
          driver: res.locals.driver || null,
          rides: rides,
          currentPage: page,
          pages: Math.ceil(totalCount / limit)
        });
    }
  } catch (err) {
      console.error('Error fetching sender rides:', err);
      req.flash('error', 'An error occurred while fetching rides. Please try again later.');
      res.render('sender-rides');
  }
});


// error page
router.get('*', (req, res) => {
  res.render('drivers-404', { driver: res.locals.driver || null });
})


module.exports = router;