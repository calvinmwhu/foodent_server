// Load required packages
var mongoose = require('mongoose');
var statesArray = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DC", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"];

var EventSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    host: [String],
    guests: [String],
    notes: String,
    address: {
        addressLineFirst: String,
        addressLineSecond: String,
        city: String,
        state: {
            type: String,
            uppercase: true,
            required: true,
            enum: statesArray
        },
        zip: {
            type: Number,
            required: true
        },
        coordinate: [Number]
    },
    time: {
        start: Date,
        end: Date
    },
    invite: String,
    inviteType: String,
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
