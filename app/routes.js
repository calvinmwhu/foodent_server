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
            document.sort(sort).skip(skip).limit(limit).select(select).exec().then(function (products) {
                if (!products) {
                    res.status(404).json({message: "resources not found", data: []});
                } else {
                    res.status(200).json({message: "OK", data: products});
                }
            }, function (err) {
                res.status(500).json({message: err.name || err.message || "Unknown Internal Server Error", data: []});
            });
        }
    };

    var getSingleResource = function (model, req, res) {
        model.findById(req.params.id, function (err, product) {
            if (err || !product) {
                res.status(404).json({message: "resource not found", data: []});
            } else {
                res.status(200).json({message: "OK", data: product});
            }
        });
    };

    var updateResource = function (model, req, res) {
        model.findByIdAndUpdate(req.params.id,
            {$set: req.body},
            {new: true, runValidators: true},
            function (err, product) {
                if (err) {
                    res.status(500).json({message: err.message || err.name || "Unknown server error", data: []});
                } else if (!product) {
                    res.status(404).json({message: "resource not found", data: []});
                } else {
                    res.status(200).json({message: "resource updated", data: product});
                }
            });
    };

    var deleteResource = function (model, req, res) {
        model.findByIdAndRemove(req.params.id,
            function (err, product) {
                if (err || !product) {
                    res.status(404).json({message: "resource not found", data: []});
                } else {
                    res.status(200).json({message: "resource deleted", data: product});
                }
            });
    };

    router.post('/signup', function (req, res) {

        // later on, will assume req.body has this structure: {user: object, address: object}
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

        // later on, will assume req.body has this structure: {event: object, invite: object, address: object}

        var event = new Event(req.body);
        // these two objects are just temporary data for testing purpose
        var invite = new Invite({
            startTime: Date.now(),
            endTime: Date.now(),
            inviteType: 'open',
            request: [{
                userId: 'asasas',
                timestamp: Date.now()
            }]
        });
        var address = new Address({
            addressLineFirst: '604 W Stoughton',
            addressLineSecond: 'apt 34',
            city: 'Urbana',
            state: 'IL',
            zip: 61801
        });

        invite.save().then(function (product) {
            var inviteId = product._id;
            event.invite = inviteId;
            return address.save();
        }).then(function (product) {
            var addressId = product._id;
            event.address = addressId;
            return event.save();
        }).then(function (product) {
            res.status(201).json({message: "Event Created", data: product});
            //Event.findOne({_id: product._id}).populate('invite').populate('address').exec(function (err, populatedEvent) {
            //    res.status(201).json({message: "Event Created", data: populatedEvent});
            //});
        }, function (err) {
            res.status(500).json({message: err, data: []});
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

    router.post('/addresses', passport.authenticate('jwt', {session: false}), function (req, res) {
        var address = new Address(req.body);
        address.save().then(function (product) {
            res.status(201).json({message: "Address Created", data: product});
        }, function (err) {
            res.status(500).json({message: err.name || err.message || "Unknown Internal Server Error", data: []});
        });
    });

    router.put('/users/:id', passport.authenticate('jwt', {session: false}), function (req, res) {
        updateResource(User, req, res);
    });

    router.put('/events/:id', passport.authenticate('jwt', {session: false}), function (req, res) {
        updateResource(Event, req, res);
    });

    router.put('/addresses/:id', passport.authenticate('jwt', {session: false}), function (req, res) {
        updateResource(Address, req, res);
    });

    router.put('/images/:id', passport.authenticate('jwt', {session: false}), function (req, res) {
        updateResource(Image, req, res);
    });

    router.put('/invite/:id', passport.authenticate('jwt', {session: false}), function (req, res) {
        updateResource(Invite, req, res);
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

    router.get('/addresses', passport.authenticate('jwt', {session: false}), function (req, res) {
        getResources(Address, req, res);
    });

    router.get('/invites', passport.authenticate('jwt', {session: false}), function (req, res) {
        getResources(Invite, req, res);
    });

    // get single resource
    router.get('/users/:id', passport.authenticate('jwt', {session: false}), function (req, res) {
        getSingleResource(User, req, res);
    });

    router.get('/events/:id', passport.authenticate('jwt', {session: false}), function (req, res) {
        getSingleResource(Event, req, res);
    });

    router.get('/addresses/:id', passport.authenticate('jwt', {session: false}), function (req, res) {
        getSingleResource(Address, req, res);
    });

    router.get('/invites/:id', passport.authenticate('jwt', {session: false}), function (req, res) {
        getSingleResource(Invite, req, res);
    });

    router.get('/images/:id', passport.authenticate('jwt', {session: false}), function (req, res) {
        getSingleResource(Image, req, res);
    });

    // delete single resource
    router.delete('/users/:id', passport.authenticate('jwt', {session: false}), function (req, res) {
        deleteResource(User, req, res);
    });

    router.delete('/events/:id', passport.authenticate('jwt', {session: false}), function (req, res) {
        deleteResource(Event, req, res);
    });

    router.delete('/addresses/:id', passport.authenticate('jwt', {session: false}), function (req, res) {
        deleteResource(Address, req, res);
    });

    router.delete('/invites/:id', passport.authenticate('jwt', {session: false}), function (req, res) {
        deleteResource(Invite, req, res);
    });

    router.delete('/images/:id', passport.authenticate('jwt', {session: false}), function (req, res) {
        deleteResource(Image, req, res);
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
};