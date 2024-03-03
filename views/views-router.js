const express = require('express');
const senderService = require('../senders/senders-services');
const senderMiddleware = require('../senders/senders-middleware');
// const SenderModel = require('../models/sender-model');
const DriverModel = require('../models/driver-model');
const OrderModel = require('../models/order-model');

const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

require('dotenv').config();

const router = express.Router();

router.use(cookieParser())

router.use(express.static('./views'));


// /views/senders/welcome (welcome page)
router.get('/', (req, res) => {
  // If the sender is already logged in, redirect to the home page
  if (req.cookies.sender_jwt) {
    res.redirect('/views/senders/sender-home');
} else {
    res.render('senders-welcome', { sender: res.locals.sender, });
  }
})


// /views/senders/welcome (welcome page)
router.get('/senders', (req, res) => {
  // If the sender is already logged in, redirect to the home page
  if (req.cookies.sender_jwt) {
    res.redirect('/views/senders/sender-home');
} else {
    res.render('senders-welcome', { sender: res.locals.sender, });
  }
})

// /views/senders/welcome (welcome page)
router.get('/welcome', async (req, res) => {
  // If the sender is already logged in, redirect to the home page
  if (req.cookies.sender_jwt) {
    res.redirect('/views/senders/sender-home');
} else {
    res.render('senders-welcome', { sender: res.locals.sender, });
  }
})

// /views/senders/welcome (welcome page)
router.get('/senders/welcome', (req, res) => {
  // If the sender is already logged in, redirect to the home page
  if (req.cookies.sender_jwt) {
    res.redirect('sender-home');
} else {
    res.render('senders-welcome', { sender: res.locals.sender, });
  }
})


// /views/senders/terms (terms page)
router.get('/senders/terms', (req, res) => {
  // If the sender is already logged in, redirect to the auth-senders-terms page
  if (req.cookies.sender_jwt) {
    res.redirect('auth-senders-terms');
} else {
    res.render('senders-terms', { sender: res.locals.sender, });
  }
})


// /views/senders/signup (signup page)
router.get('/senders/signup', (req, res) => {
  // If the sender is already logged in, redirect to the home page
  if (req.cookies.sender_jwt) {
    res.redirect('sender-home');
} else {
    res.render('senders-signup', { sender: res.locals.sender || null,  messages: req.flash() });
  }
})


// /views/senders/signup (senders signup post request)
router.post('/senders/signup', senderMiddleware.ValidateSenderCreation, async (req, res) => {
  const response = await senderService.CreateSender(req.body);
  if (response.code === 200) {
    req.flash('success', 'Signup successful. Check your E-mail for verification, then you can login.');
    res.redirect('signup');
  } else if (response.code === 409) {
    req.flash('error', 'Sender already exists. You can login or check your E-mail for verification.');
    res.redirect('signup');
  } else {
    req.flash('error', response.message);
    res.redirect('senders-404');
  }
});


// /views/senders/verify-email (verification page)
router.get('/senders/verify-email', async (req, res) => {
  const response = await senderService.SenderVerifyEmail(req, res)
  console.log(response);
  if (response.code === 200) {
    res.render('sender-email-verify-success', { sender: res.locals.sender});
  } else if (response.code === 208) {
    res.render('sender-email-already-verified', { sender: res.locals.sender});
  } else if (response.code === 401 || 410) {
    res.render('sender-email-verify-failed', { sender: res.locals.sender});
  } else if (response.code === 404){
    res.render('sender-email-verify-not-found', { sender: res.locals.sender});
  } else {
    res.render('senders-404', { error: response.message })
  }
})



// /views/senders/resend-verification-email (reverify page)
router.get('/senders/resend-verification-email', (req, res) => {
  // If the sender is already logged in, redirect to the home page
  if (req.cookies.sender_jwt) {
    res.redirect('sender-home');
} else {
    res.render('sender-reverify-email', { sender: res.locals.sender || null,  messages: req.flash() });
  }
})


// /views/senders/resend-verification-email (reverify post request)
router.post('/senders/resend-verification-email', senderMiddleware.SenderReverifyValidation, async (req, res) => {
  const { email } = req.body;
  const response = await senderService.SenderReVerifyEmail(email);
  if (response.code === 200) {
    req.flash('success', 'Verification Email has been resent. Check your Email for verification, then you can login.');
    res.redirect('login');
  } else if (response.code === 404) {
    req.flash('error', 'Sender not found. Signup to create an account.');
    res.redirect('signup');
  } else {
    req.flash('error', response.message);
    res.redirect('senders-404');
  }
});



// // /views/senders/login (login page)
// router.get('/senders/login', (req, res) => {
//   // If the sender is already logged in, redirect to the home page
//   if (req.cookies.sender_jwt) {
//     res.redirect('sender-home');
// } else {
//     res.render('senders-login', { sender: res.locals.sender || null, messages: req.flash() });
//   }
// })


// /views/senders/login (login page)
router.get('/senders/login', (req, res) => {
  // Check if the sender JWT token exists in cookies
  if (req.cookies.sender_jwt) {
    // Decode the JWT token to check its expiration
    const token = req.cookies.sender_jwt;
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      if (err) {
        // If there's an error verifying the token, clear it from cookies
        res.clearCookie('sender_jwt');
        console.error('Error verifying token:', err);
        // Redirect to login page or handle the error as appropriate
        res.redirect('/views/senders/login');
      } else {
        // Token is valid, check if it's expired
        if (decodedToken.exp * 1000 < Date.now()) {
          // If the token has expired, clear it from cookies
          res.clearCookie('sender_jwt');
          // Redirect to login page 
          res.redirect('/views/senders/login');
        } else {
          // If the token is still valid, redirect to the home page
          res.redirect('sender-home');
          return;
        }
      }
    });
  }

  // If the sender JWT token doesn't exist or has expired, render the login page
  res.render('senders-login', { sender: res.locals.sender || null, messages: req.flash() });
});


// /views/senders/login (login post request)
router.post('/senders/login', senderMiddleware.SenderLoginValidation, async (req, res) => {
  const response = await senderService.SenderLogin({ email: req.body.email, password: req.body.password })
  if (response.code === 200) {
    // set cookie
    res.cookie('sender_jwt', response.data.token, {maxAge: 1 * 24 * 60 * 60 * 1000})
    // res.cookie('sender_jwt', response.data.token, {maxAge: 1 * 60 * 1000})
    res.redirect('sender-home')
  } else if (response.code === 403) {
    res.render('sender-email-not-verified', { sender: res.locals.sender})
  } else if (response.code === 404) {
    req.flash('error', 'Sorry, the sender details provided are invalid. Please check the details and try again.');
    res.redirect('login')
  }else if (response.code === 422) {
    req.flash('error', 'Sorry, the email or password provided is incorrect. Please check your login details and try again.');
    res.redirect('login')
  }else {
    res.render('senders-404', { error: response.message })
  }
});


// /views/senders/forgot-password (forgot-password page)
router.get('/senders/forgot-password', (req, res) => {
  // If the sender is already logged in, redirect to the home page
  if (req.cookies.sender_jwt) {
    res.redirect('sender-home');
} else {
    res.render('sender-forgot-password', { sender: res.locals.sender || null, messages: req.flash() });
  }
})


// /views/senders/forgot-password (forgot-password post request)
router.post('/senders/forgot-password', senderMiddleware.SenderForgotPasswordValidation, async (req, res) => {
  const { email } = req.body;
  const response = await senderService.SenderForgotPassword(email)
  if (response.code === 200) {
    req.flash('success', 'Password reset email has been resent. Check you Email to change your password.');
    res.redirect('forgot-password')
  } else if (response.code === 404) {
    req.flash('error', 'Sender not found. Please check the Email input and try again.');
    res.redirect('forgot-password')
  }else {
    res.render('senders-404', { error: response.message })
  }
});



// /views/senders/reset-password (reset-password page)
router.get('/senders/reset-password', (req, res) => {
  // If the sender is already logged in, redirect to the home page
  if (req.cookies.sender_jwt) {
    return res.redirect('sender-home');
  }
  const token = req.query.token || req.cookies.sender_password_jwt;
  if (!token) {
    req.flash('error', 'Reset token is missing.');
    return res.redirect('forgot-password');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded);
    // Token is valid
    // Set JWT token in the cookie
    res.cookie('sender_password_jwt', token, { maxAge: 5 * 60 * 1000, httpOnly: true });
    // Pass sender information to the reset password page
    res.render('sender-reset-password', { sender: res.locals.sender || null, token: req.query.token, messages: req.flash() });
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

// /views/senders/reset-password (reset-password post request)
router.post('/senders/reset-password', async (req, res) => {
  try {
    const token = req.cookies.sender_password_jwt; // Access JWT token from cookie

    const newPassword = req.body.password;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const response = await senderService.SenderResetPassword(decoded._id, newPassword);
    console.log(response);
    if (response.code === 200) {
      req.flash('success', 'Password changed successfully. You can now login with your new password.');
      res.clearCookie('sender_password_jwt');
      res.redirect('login');
    } else if (response.code === 400) {
      req.flash('error', 'New password must be different from the current password.')
      res.redirect('reset-password')
    } else if (response.code === 410 || response.code === 401) {
      req.flash('error', 'Invalid or expired reset link. Please try again.');
      res.redirect('forgot-password');
    } else if (response.code === 404) {
      req.flash('error', 'Sender not found. Please try again.');
      res.redirect('forgot-password');
    } else {
      res.render('senders-404', { error: response.message });
    }
  } catch (error) {
    console.error('Error resetting password:', error);
    req.flash('error', 'An error occurred while resetting the password. Please try again.');
    res.redirect('forgot-password');
  }
});



// PROTECTED ROUTE
router.use(async (req, res, next) => {

  const token = req.cookies.sender_jwt;

  if (token) {
      try {
        const decodedValue = await jwt.verify(token, process.env.JWT_SECRET);

        res.locals.sender = decodedValue;
      
        next()
      } catch (error) {
        res.redirect('/views/senders/login')
      }
  } else {
      res.redirect('/views/senders/login')
  }
})


// /views/senders/logout
router.get('/senders/logout', (req, res) => {    
  res.clearCookie('sender_jwt')
  res.redirect('login')
});


// /views/senders/home (sender logged in)
router.get('/senders/sender-home', (req, res) => {
  console.log({ sender: res.locals.sender })
  res.render('sender-home', { sender: res.locals.sender });
})


// /views/senders/auth-senders-terms (sender logged in)
router.get('/senders/auth-senders-terms', (req, res) => {
  console.log({ sender: res.locals.sender })
  res.render('auth-senders-terms', { sender: res.locals.sender });
})




// for socketIO book ride
router.get('/senders/book-ride', (req, res) => {
  // console.log({ sender: res.locals.sender })
  res.render('sender-book-ride', { sender: res.locals.sender });
})



// // for socketIO my rides
// Route to fetch sender's rides with pagination
router.get('/senders/my-rides', async (req, res) => {
  try {
      // Get the sender's JWT token from the cookie
      const token = req.cookies.sender_jwt;

      // Decode the sender's JWT to get the sender's _id
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      const senderId = decodedToken._id;

      // Pagination parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
      const skip = (page - 1) * limit;

      // Find orders associated with the sender's _id with pagination
      const orders = await OrderModel.find({ sender: senderId })
        .sort({ created_at: -1 }) // Sort by craetes_at in descending order
        .skip(skip)
        .limit(limit);
      const totalCount = await OrderModel.countDocuments({ sender: senderId });


      // Fetch driver details for each order
      const rides = await Promise.all(orders.map(async (order) => {
        const driver = await DriverModel.findById(order.driver);
        return {
          current_location: order.current_location,
          destination: order.destination,
          price: order.price,
          status: order.status,
          created_at: order.created_at,
          driver: {
            first_name: driver.first_name,
            last_name: driver.last_name,
            vehicle_name: driver.vehicle_name,
            vehicle_color: driver.vehicle_color
          }
        };
      }));

      if (orders.length === 0) {
        req.flash('error', 'Rides not found. You have not completed any trip.')
        res.render('sender-rides', {
          sender: res.locals.sender || null,
          rides: rides,
          currentPage: page,
          pages: Math.ceil(totalCount / limit)
        });
      } else {
          res.render('sender-rides', {
            sender: res.locals.sender || null,
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
  res.render('senders-404', { sender: res.locals.sender || null });
})



module.exports = router;