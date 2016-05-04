// Load required packages
var mongoose = require('mongoose');
var Address = require('./address');
var Invite = require('./invite');

var EventSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    host: [String],
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
    numGuestsAllowed: Number,
    food: {
        cuisine: [String],
        description: String,
        items: [String]
    }
});

// Export the Mongoose model
module.exports = mongoose.model('Event', EventSchema);
