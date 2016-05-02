var mongoose = require('mongoose');
var statesArray = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DC", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"];

var AddressSchema = new mongoose.Schema({
    addressLineFirst: {
        type: String,
        required: true
    },
    addressLineSecond: String,
    city: {
        type: String,
        required: true
    },
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
});

module.exports = mongoose.model('Address', AddressSchema);



