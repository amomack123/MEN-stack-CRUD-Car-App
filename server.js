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
const Car = require('./models/cars.js'); // Make sure this path is correct
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


app.get('/cars', async (req, res) => {
  try {
    const cars = await Car.find(); // Fetch all cars
    const user = req.session.user || null; // Get user from session
    res.render('collections/show', { cars, user }); // Render show.ejs in the collections folder
  } catch (err) {
    console.error('Error retrieving cars:', err);
    res.status(500).send('Error retrieving cars');
  }
});





app.get('/sign-in', (req, res) => {
  res.render('auth/sign-in'); 
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
    const userId = req.params.userId;
    console.log(`Fetching collection for user: ${userId}`);
    
    const user = await User.findById(userId).populate('favorites').exec(); // Populate favorites with car details
    
    if (user) {
      console.log(`User's collection: ${JSON.stringify(user.favorites)}`);
      res.render('collections/show', { cars: user.favorites, user });
    } else {
      res.status(404).send('User not found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving collection');
  }
});




app.post('/collections/add', async (req, res) => {
  try {
    const { userId, carId } = req.body;
    
    console.log(`User ID: ${userId}`);
    console.log(`Car ID: ${carId}`);
    
    const user = await User.findById(userId).exec();
    if (user) {
      if (!user.favorites.includes(carId)) { // Check if the car is not already in favorites
        user.favorites.push(carId);
        await user.save();
        console.log(`Car ${carId} added to user ${userId}'s collection`);
      } else {
        console.log(`Car ${carId} is already in user ${userId}'s collection`);
      }
      res.redirect(`/users/${userId}/collections/show`); // Redirect to the user's collection page
    } else {
      res.status(404).send('User not found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});








app.post('/sign-in', async (req, res) => {
  const authenticatedUser = await authenticateUser(req.body);

  if (authenticatedUser) {
    req.session.user = authenticatedUser; // Save user in session
    res.redirect('/');
  } else {
    res.status(401).send('Invalid credentials');
  }
});




app.use(isSignedIn);
app.use('/stylesheets', express.static('stylesheets'));
app.use(passUserToHome);

app.listen(port, () => {
  console.log(`The express app is ready on port ${port}!`);
});
