// Load required packages
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var Address = require('./address');


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
    eventsAttended: [String],
    eventsHosted: [String],
    profileImage: {
        type: String
    },
    //address: {
    //    type: mongoose.Schema.ObjectId,
    //    ref: 'Address'
    //},
    notifications: [{
        text: String, notificationType: String, user_id: String, event_id: String, isRead: Boolean
    }]
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
