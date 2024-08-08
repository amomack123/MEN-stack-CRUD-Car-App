const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const session = require('express-session');
const path = require("path");
const methodOverride = require('method-override');

const authController = require('./controllers/auth.js');
const carsController = require('./controllers/cars.js');
const isSignedIn = require('./middleware/is-signed-in.js');
const passUserToHome = require('./middleware/pass-user-to-home.js');

// Import your Car model
const Car = require('./models/car.js'); // Make sure this path is correct

const port = process.env.PORT || '3000';

mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on('connected', () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
});

// Middleware setup
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, "public")));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET, // Make sure SESSION_SECRET is defined in your .env file
  resave: false,
  saveUninitialized: true
}));

// Set up ejs
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware for passing user to home
app.use(passUserToHome);

// The route to render the index page with the list of cars
app.get('/', async (req, res) => {
  try {
      const cars = await Car.find(); // Query all cars from your MongoDB collection
      res.render('index', { cars, user: req.session.user }); // Pass the cars and user to your EJS template
  } catch (err) {
      console.log('Error retrieving cars:', err);
      res.status(500).send('Error retrieving cars');
  }
});
app.get('/', (req, res) => {
  res.render('index', { user: req.user });
});
app.get('/cars', (req, res) => {
  const userId = req.query.userId;
  Car.find({ userId: userId }, (err, cars) => {
    if (err) {
      // Handle error
      return res.status(500).send('Error occurred');
    }
    res.render('cars', { cars: cars });
  });
});





// Routes
app.use('/auth', authController);
app.use('/cars', carsController);
app.use(isSignedIn);

app.listen(port, () => {
  console.log(`The express app is ready on port ${port}!`);
});
