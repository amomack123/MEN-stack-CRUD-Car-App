const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // Import bcryptjs

const User = require('../models/user.js');

// Render sign-up page
router.get('/sign-up', (req, res) => {
  res.render('auth/sign-up.ejs');
});

// Render sign-in page
router.get('/sign-in', (req, res) => {
  res.render('auth/sign-in.ejs');
});

// Handle sign-out
router.get('/sign-out', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Handle sign-up
router.post('/sign-up', async (req, res) => {
  try {
    const userInDatabase = await User.findOne({ username: req.body.username });
    if (userInDatabase) {
      return res.send('Username already taken.');
    }
  
    if (req.body.password !== req.body.confirmPassword) {
      return res.send('Password and Confirm Password must match');
    }
  
    const hashedPassword = bcrypt.hashSync(req.body.password, 10); // Hashing the password
    req.body.password = hashedPassword;
  
    await User.create(req.body);
  
    res.redirect('/auth/sign-in');
  } catch (error) {
    console.error('Sign-up error:', error.message); // Improved error logging
    res.redirect('/');
  }
});

// Handle sign-in
router.post('/sign-in', async (req, res) => {
  try {
    const userInDatabase = await User.findOne({ username: req.body.username });
    if (!userInDatabase) {
      return res.send('Login failed. Please try again.');
    }
  
    const validPassword = bcrypt.compareSync(req.body.password, userInDatabase.password); // Comparing the password
    if (!validPassword) {
      return res.send('Login failed. Please try again.');
    }
  
    req.session.user = {
      username: userInDatabase.username,
      _id: userInDatabase._id
    };
  
    res.redirect('/');
  } catch (error) {
    console.error('Sign-in error:', error.message); // Improved error logging
    res.redirect('/');
  }
});

module.exports = router;