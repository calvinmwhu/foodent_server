// Load required packages
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var statesArray = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DC", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"];

var UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        enum: ['male', 'female']
    },
    about: {
        type: String
    },
    reputationPoints: {
        type: Number,
        default: 0
    },
    following: {
        type: [String]
    },
    followers: {
        type: [String]
    },
    history: {
        attended: [String],
        hosted: [String]
    },
    profileImage: {
        type: String
    },
    address: {
        addressLineFirst: String,
        addressLineSecond: String,
        city: String,
        state: {
            type: String,
            uppercase: true,
            //required: true,
            enum: statesArray
        },
        zip: {
            type: Number
            //required: true
        },
        coordinate: [Number]
    }
});


UserSchema.pre('save', function (next) {
    var user = this;
    if (this.isModified('password') || this.isNew) {
        bcrypt.genSalt(10, function (err, salt) {
            if (err) {
                return next(err);
            }
            bcrypt.hash(user.password, salt, null, function (err, hash) {
                if (err) {
                    return next(err);
                }
                user.password = hash;
                next();
            });
        });
    } else {
        return next();
    }
});

UserSchema.methods.comparePassword = function (password, cb) {
    bcrypt.compare(password, this.password, function (err, isMatch) {
        if (err) {
            return cb(err);
        }
        cb(null, isMatch);
    });
};

// Export the Mongoose model
module.exports = mongoose.model('User', UserSchema);
