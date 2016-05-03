var User = require('./models/user');
var Image = require('./models/image');
var Event = require('./models/event');
var Invite = require('./models/invite');
var Address = require('./models/address');
var jwt = require('jwt-simple');
var config = require('../config/database');

module.exports = function (router, passport) {

    var getResources = function (model, req, res) {
        var where = eval("(" + req.query.where + ")");
        var sort = eval("(" + req.query.sort + ")");
        var select = eval("(" + req.query.select + ")");
        var skip = eval("(" + req.query.skip + ")");
        var limit = eval("(" + req.query.limit + ")");
        var count = eval("(" + req.query.count + ")");
        var document = model.find(where);

        if (count) {
            document.count(function (err, count) {
                if (err) {
                    res.status(500).json({message: err.name || err.message, data: []});
                } else {
                    res.status(200).json({message: "OK", data: count});
                }
            });
        } else {
            document.sort(sort).skip(skip).limit(limit).select(select).exec().then(function (product) {
                res.status(200).json({message: "OK", data: product});
            }, function (err) {
                res.status(500).json({message: err.name || err.message || "Unknown Internal Server Error", data: []});
            });
        }
    };

    router.post('/signup', function (req, res) {
        if (!req.body.name || !req.body.email || !req.body.password || !req.body.profileImageUrl) {
            res.status(500).json({message: "Please enter a name, an email, a password, and a image url"});
        } else {
            //var newuser = User({name: req.body.name, email: req.body.email, password: req.body.password});
            var newuser = new User(req.body);
            var profileImage = new Image({url: req.body.profileImageUrl});

            profileImage.save().then(function (image) {
                newuser.profileImage = image._id;
                return newuser.save();
            }).then(function (user) {
                var token = jwt.encode({id: user._id, email: user.email}, config.secret);
                res.status(201).json({success: true, message: "User created", data: user, token: 'JWT ' + token});
            }, function (err) {
                var errorMsg = err.name || "Unknown error";
                res.status(500).json({success: false, message: errorMsg, data: []});
            });

            //newuser.save().then(function (user) {
            //    var token = jwt.encode({name: user.name, email: user.email}, config.secret);
            //    res.status(201).json({success: true, message: "User created", data: user, token: 'JWT ' + token});
            //}, function (err) {
            //    var errorMsg = err.name || "Unknown error";
            //    res.status(500).json({success: false, message: errorMsg, data: []});
            //});
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
                        var token = jwt.encode({id: user._id, email: user.email}, config.secret);
                        // return the information including token as JSON
                        res.status(200).json({
                            success: true,
                            message: 'Authentication succeeded',
                            data: user,
                            token: 'JWT ' + token
                        });
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


    router.post('/events', passport.authenticate('jwt', {session: false}), function (req, res) {
        var event = new Event(req.body);

        //var invite = new Invite({
        //    startTime: Date.now(),
        //    endTime: Date.now(),
        //    inviteType: 'open'
        //});
        //
        //event.invite = invite;


        event.save().then(function (product) {
            res.status(201).json({message: "Event Created", data: product});
        }, function (err) {
            res.status(500).json({message: err.name || err.message || "Unknown Internal Server Error", data: []});
        });
    });

    router.post('/invites', passport.authenticate('jwt', {session: false}), function (req, res) {
        var invite = new Invite(req.body);
        invite.save().then(function (product) {
            res.status(201).json({message: "Invite Created", data: product});
        }, function (err) {
            res.status(500).json({message: err.name || err.message || "Unknown Internal Server Error", data: []});
        });
    });

    router.put('/user/:id', passport.authenticate('jwt', {session: false}), function(req, res){
        var address = new Address(req.address);
        var newuser = new User(req.user);

        if (address) {
            newuser.address = address;
        }
        User.findByIdAndUpdate(req.params.id,
            newuser,
            {new: true, runValidators: true},
            function (err, user) {
                if (err) {
                    res.status(500).json({message: err.name || err.message || "Unknown server error", data: []});
                } else if (!user) {
                    res.status(404).json({message: "User not found", data: []});
                } else {
                    res.status(200).json({message: "User updated", data: user});
                }
            });
    });

    router.put('/event/:id', passport.authenticate('jwt', {session: false}), function(req, res){
        var address = new Address(req.address);
        var newevent = new User(req.event);

        if (address) {
            event.address = address;
        }
        Event.findByIdAndUpdate(req.params.id,
            newEvent,
            {new: true, runValidators: true},
            function (err, event) {
                if (err) {
                    res.status(500).json({message: err.name || err.message || "Unknown server error", data: []});
                } else if (!user) {
                    res.status(404).json({message: "Event not found", data: []});
                } else {
                    res.status(200).json({message: "Event updated", data: user});
                }
            });
    });

    router.delete(function (req, res) {
        User.findByIdAndRemove(req.params.user_id,
            function (err, user) {
                if (err || !user) {
                    res.status(404).json({message: "User not found", data: []});
                } else {
                    res.status(200).json({message: "User deleted", data: user});
                }
            });
    });


    router.get('/userprofile', passport.authenticate('jwt', {session: false}), function (req, res) {
        res.status(200).json({success: true, message: 'Welcome to your profile page', data: req.user});
    });

    router.get('/users', passport.authenticate('jwt', {session: false}), function (req, res) {
        getResources(User, req, res);
    });

    router.get('/images', passport.authenticate('jwt', {session: false}), function (req, res) {
        getResources(Image, req, res);
    });

    router.get('/events', passport.authenticate('jwt', {session: false}), function (req, res) {
        getResources(Event, req, res);
    });


    router.options('/authenticate', function (req, res) {
        res.writeHead(200);
        res.end();
    });

    router.options('/signup', function (req, res) {
        res.writeHead(200);
        res.end();
    });

    router.options('/events', function (req, res) {
        res.writeHead(200);
        res.end();
    });

    router.options('/invites', function (req, res) {
        res.writeHead(200);
        res.end();
    });

    router.options('/users', function (req, res) {
        res.writeHead(200);
        res.end();
    });

    //router.get('/users', passport.authenticate('jwt', {session: false}), function (req, res) {
    //    var where = eval("(" + req.query.where + ")");
    //    var sort = eval("(" + req.query.sort + ")");
    //    var select = eval("(" + req.query.select + ")");
    //    var skip = eval("(" + req.query.skip + ")");
    //    var limit = eval("(" + req.query.limit + ")");
    //    var count = eval("(" + req.query.count + ")");
    //    var document = User.find(where);
    //
    //    if (count) {
    //        document.count(function (err, count) {
    //            if (err) {
    //                res.status(500).json({message: err.name || err.message, data: []});
    //            } else {
    //                res.status(200).json({message: "OK", data: count});
    //            }
    //        });
    //    } else {
    //        document.sort(sort).skip(skip).limit(limit).select(select).exec().then(function (user) {
    //            res.status(200).json({message: "OK", data: user});
    //        }, function (err) {
    //            res.status(500).json({message: err.name || err.message || "Unknown Internal Server Error", data: []});
    //        });
    //    }
    //});
};