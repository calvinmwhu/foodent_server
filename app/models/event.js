// Load required packages
var mongoose = require('mongoose');
var Address = require('./address');
var Invite = require('./invite');
var cuisineType = ['Chinese','American','Indian','Thai','Cajun', 'Arab'];

var EventSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    host: {
        type: String,
        required: true
    },
    guests: [String],
    notes: String,
    address: {
        type: mongoose.Schema.ObjectId,
        ref: 'Address'
    },
    time: {
        start: Date,
        end: Date
    },
    invite: {
        type: mongoose.Schema.ObjectId,
        ref: 'Invite'
    },
    images: [String],
    numGuestsAllowed: {
        type: Number,
        default: 100
    },
    food: {
        cuisine: [String],
        description: String
    },
    tags: [String]
});

// Export the Mongoose model
module.exports = mongoose.model('Event', EventSchema);
