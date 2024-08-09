const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const morgan = require('morgan')
const session = require('express-session');
const path = require("path");
const methodOverride = require('method-override');

const authController = require('./controllers/auth.js');
const carsController = require('./controllers/cars.js');
const isSignedIn = require('./middleware/is-signed-in.js');
const passUserToHome = require('./middleware/pass-user-to-home.js');

// Import your Car model
const Car = require('./models/car.js'); // Make sure this path is correct
const User = require('./models/user.js');

const port = process.env.PORT || '3000';

mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on('connected', () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
});

// Middleware setup
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, "public")));
app.use(morgan('dev'))

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

app.get('/', async (req, res) => {
  try {
      const cars = await Car.find(); // Query all cars from your MongoDB collection
      res.render('index', { cars, user: req.session.user }); // Pass the cars and user to your EJS template
  } catch (err) {
      console.log('Error retrieving cars:', err);
      res.status(500).send('Error retrieving cars');
  }
});

// Route to display all cars
app.get('/', (req, res) => {
  const userId = req.query.userId;
  Car.find({ userId: userId }, (err, cars) => {
    if (err) {
      // Handle error
      return res.status(500).send('Error occurred');
    }
    res.render('cars', { cars: cars });
  });
});

// Route to render the new car form
app.get('/collections/new', (req, res) => {
  res.render('collections/new'); // Render the new car form
});

// Route to render the edit car form
app.get('/collections/edit/:id', async (req, res) => {
  try {
    const car = await Car.findById(req.params.id); // Find the car by its ID
    if (!car) {
      return res.status(404).send('Car not found');
    }
    res.render('collections/edit', { car }); // Render the edit form with the car data
  } catch (err) {
    console.log('Error retrieving car:', err);
    res.status(500).send('Error retrieving car');
  }
});

// Route to display the car collection
app.get('/collections/show', async (req, res) => {
  try {
    const cars = await Car.find(); // Query all cars from your MongoDB collection
    if (cars.length === 0) {
      return res.render('collections/show', { cars, message: 'No Cars in your Collection yet.' }); // Render with a message if no cars
    }
    res.render('collections/show', { cars }); // Render the collection
  } catch (err) {
    console.log('Error retrieving cars:', err);
    res.status(500).send('Error retrieving cars');
  }
});

// Routes
app.use('/auth', authController);
app.use('/cars', carsController);

// The route to render the index page with the list of cars
app.get('/cars', async (req, res) => {
  try {
    const cars = await Car.find(); // Query all cars from your MongoDB collection
    res.render('collections/show', { cars }); // Pass the cars and user to your EJS template
  } catch (err) {
    console.log('Error retrieving cars:', err);
    res.status(500).send('Error retrieving cars');
  }
});




// Route to handle adding a new car
app.post('/users/:userId/cars', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { name, model, year, color, price, description } = req.body;

    // Create a new car object with the user reference
    const newCar = new Car({
      name,
      model,
      year,
      color,
      price,
      description,
      user: userId // Reference to the user who created the car
    });

    // Save the car to the database
    await newCar.save();

    // Redirect the user to their collection page
    res.redirect(`/users/${userId}/collections/show`);
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});



// Route to handle favoriting a car
app.post('/users/:userId/cars/:carId/favorite', async (req, res) => {
  try {
    const userId = req.params.userId;
    const carId = req.params.carId;

    // Find the user and add the car to their collection
    await User.findByIdAndUpdate(userId, {
      $addToSet: { favorites: carId }
    });

    // Redirect to the user's collection page
    res.redirect(`/users/${userId}/collections/show`);
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

// Route to display the car collection for a user
app.get('/users/:userId/collections/show', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('favorites');
    res.render('collections/show', { cars: user.favorites });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving collection');
  }
});


app.use(isSignedIn);
app.use('/stylesheets', express.static('stylesheets'));

app.listen(port, () => {
  console.log(`The express app is ready on port ${port}!`);
});

