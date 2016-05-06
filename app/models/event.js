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
    guests: [mongoose.Schema.ObjectId],
    notes: String,
    //address: {
    //    type: mongoose.Schema.ObjectId,
    //    ref: 'Address'
    //},
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
    tags: [String],
    longitude: {
        type: Number,
        required: true
    },
    latitude: {
        type: Number,
        required: true
    },
    formatted_address: {
        type: String,
        required: true
    }
});

// Export the Mongoose model
module.exports = mongoose.model('Event', EventSchema);
