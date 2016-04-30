var User = require('./models/user');
var jwt = require('jwt-simple');
var config = require('../config/database');

module.exports = function (router, passport) {

    router.post('/signup', function (req, res) {
        if (!req.body.name || !req.body.email || !req.body.password) {
            res.status(500).json({message: "Please enter a name, an email, and a password"});
        } else {
            var newuser = User({name: req.body.name, email: req.body.email, password: req.body.password});
            newuser.save().then(function (user) {
                res.status(201).json({success: true, message: "User created", data: user});
            }, function (err) {
                var errorMsg = err.name || "Unknown error";
                res.status(500).json({success: false, message: errorMsg, data: []});
            });
        }
    });


    router.post('/authenticate', function (req, res) {
        User.findOne({
            email: req.body.email
        }, function (err, user) {
            if (err) throw err;
            if (!user) {
                res.status(401).json({message: 'Authentication failed. User not found.', data: []});
            } else {
                // check if password matches
                user.comparePassword(req.body.password, function (err, isMatch) {
                    if (isMatch && !err) {
                        // if user is found and password is right create a token
                        var token = jwt.encode({name: user.name, email: user.email}, config.secret);
                        // return the information including token as JSON
                        res.status(200).json({success: true, message: 'Authentication succeeded', data: token});
                    } else {
                        res.status(401).json({
                            success: false,
                            message: 'Authentication failed, wrong password',
                            data: []
                        });
                    }
                });
            }
        });
    });


    router.options('/authenticate', function (req, res) {
        res.writeHead(200);
        res.end();
    });


    router.options('/signup', function (req, res) {
        res.writeHead(200);
        res.end();
    });

    router.get('/userprofile', passport.authenticate('jwt', {session: false}), function (req, res) {
        res.status(200).json({success: true, message: 'Welcome to your profile page', data: req.user});
    });
};