var User = require('./models/user');
var jwt = require('jwt-simple');
var config = require('../config/database');

module.exports = function (router, passport) {

    router.post('/signup', function (req, res) {
        if (!req.body.name || !req.body.email || !req.body.password) {
            res.json({message: "Please enter a name, an email, and a password"});
        } else {
            var newuser = User({name: req.body.name, email: req.body.email, password: req.body.password});
            newuser.save().then(function (user) {
                res.status(201).json({message: "User created", data: user});
            }, function (err) {
                var errorMsg = err.name || "Unknown error";
                res.status(500).json({message: errorMsg, data: []});
            });
        }
    });


    router.post('/authenticate', function (req, res) {
        User.findOne({
            email: req.body.email
        }, function (err, user) {
            if (err) throw err;
            if (!user) {
                res.json({message: 'Authentication failed. User not found.', data: []});
            } else {
                // check if password matches
                user.comparePassword(req.body.password, function (err, isMatch) {
                    if (isMatch && !err) {
                        // if user is found and password is right create a token
                        var token = jwt.encode(user, config.secret);
                        // return the information including token as JSON
                        res.json({message: 'Authentication succeeded', data: token});
                    } else {
                        res.json({message: 'Authentication failed, wrong password', data: []});
                    }
                });
            }
        });
    });

    var getToken = function (headers) {
        if (headers && headers.authorization) {
            var parted = headers.authorization.split(' ');
            if (parted.length === 2) {
                return parted[1];
            } else {
                return null;
            }
        } else {
            return null;
        }
    };

    router.get('/userprofile', passport.authenticate('jwt', {session: false}), function(req, res) {
        var token = getToken(req.headers);
        if (token) {
            var decoded = jwt.decode(token, config.secret);
            User.findOne({
                email: decoded.email
            }, function(err, user) {
                if (err) throw err;

                if (!user) {
                    return res.status(403).json({message: 'Authentication failed. User not found.', data: []});
                } else {
                    res.json({message: 'Welcome to your profile page', data: user});
                }
            });
        } else {
            return res.status(403).json({message: 'No token provided.', data: []});
        }
    });
};