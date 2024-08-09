const mongoose = require('mongoose');

// Define the user schema
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    dateJoined: {
        type: Date,
        default: Date.now
    },
    favoriteCars: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Car'
    }]
    // Add more fields as needed
});

// Create the User model from the schema
const User = mongoose.model('User', userSchema);

// Export the model so it can be used in other parts of the app
module.exports = User;
