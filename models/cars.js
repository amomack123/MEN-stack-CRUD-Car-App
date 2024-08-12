const mongoose = require('mongoose');

// Define the car schema
const carSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    model: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    color: {
        type: String,
        required: false
    },
    price: {
        type: Number,
        required: false
    },
    description: {
        type: String,
        required: false
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
    // Add more fields as needed
});

// Create the Car model from the schema
const Car = mongoose.model('Car', carSchema);

// Export the model so it can be used in other parts of the app
module.exports = Car;
