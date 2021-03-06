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
                res.status(500).json({message: err || "Unknown Internal Server Error", data: []});
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

        if (!req.body.name || !req.body.email || !req.body.password || !req.body.profileImage) {
            res.status(500).json({message: "Please enter a name, an email, a password, and an image url"});
        } else {
            var newuser = new User(req.body);
            // we do not save address here
            newuser.save().then(function (user) {
                var token = jwt.encode({id: user._id, email: user.email}, config.secret);
                res.status(201).json({success: true, message: "User created", data: user, token: 'JWT ' + token});
            }, function (err) {
                var errorMsg = err.message || err.name || "Unknown error";
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

    //this is for creating an event, we assume you only create invite after event is created. you don't create them at the same time
    //look at what this event post route expects request to give it, then design your front-end according to it
    router.post('/events', passport.authenticate('jwt', {session: false}), function (req, res) {

        var event = new Event({
            name: req.body.name,
            host: req.body.host,
            notes: req.body.notes,
            time: {
                start: req.body.startTime,
                end: req.body.endTime
            },
            images: req.body.imageUrls,
            numGuestsAllowed: req.body.numGuestsAllowed,
            food: {
                cuisine: req.body.cuisine,
                description: req.body.foodDescription
            },
            tags: req.body.tags,
            formatted_address: req.body.formatted_address,
            longitude: req.body.longitude,
            latitude: req.body.latitude

        });

        // save event, then we also want to update the user's eventsHosted array
        event.save().then(function (newEvent) {
            var eventId = newEvent._id;
            var hostId = newEvent.host;
            User.findByIdAndUpdate(hostId, {$push: {eventsHosted: eventId}}, function (err, product) {
                if (err) {
                    res.status(500).json({message: err || "Unknown server error", event: newEvent});
                } else {
                    res.status(201).json({message: "event created", event: newEvent});
                }
            });
        }, function (err) {
            res.status(500).json({message: err || "Unknown server error", data: []});
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


    // this is for adding an invite to an event
    // look at the newInvite structure to determine how to send request
    router.post('/events/:id/invite', passport.authenticate('jwt', {session: false}), function (req, res) {
        var newInvite = new Invite({
            startTime: req.body.startTime,
            endTime: req.body.endTime,
            inviteType: req.body.inviteType
        });
        newInvite.save().then(function (product) {
            return Event.findByIdAndUpdate(req.params.id, {$set: {invite: product._id}}, {new: true}).populate('invite').exec();
        }).then(function (response) {
            res.status(200).json({message: "Event updated", data: response.invite});
        }, function (err) {
            res.status(500).json({message: err, data: []});
        });
    });

    // this is for deleting an invite from an event
    // look at the newInvite structure to determine how to send request
    router.delete('/events/:event_id/invite', passport.authenticate('jwt', {session: false}), function (req, res) {
        Event.findByIdAndUpdate(req.params.event_id, {$set: {invite: undefined}}, {new: true}).exec().then(function (response) {
            res.status(200).json({message: "invite deleted", data: response.invite});
        }, function (err) {
            res.status(500).json({message: err, data: []});
        });
    });

    // follow a user end point, :id in url is the current user id
    // the idToFollow is in the req body
    router.put('/followuser/:id', passport.authenticate('jwt', {session: false}), function (req, res) {
        var currentId = req.params.id;
        var idToFollow = req.body.idToFollow;

        User.findByIdAndUpdate(currentId, {$addToSet: {following: idToFollow}}, function (err, product) {
            if (err) {
                res.status(500).json({message: err || err.name || "Unknown server error", data: []});
            } else {
                User.findByIdAndUpdate(idToFollow, {$addToSet: {followers: currentId}}, {new: true}, function (err, newUser) {
                    if (err) {
                        res.status(500).json({message: err || "Unknown server error", data: []});
                    } else {
                        res.status(200).json({message: "resource updated", data: newUser});
                    }
                });
            }
        });
    });


    // follow a user end point, :id in url is the current user id
    // the idToFollow is in the req body
    router.put('/unfollowuser/:id', passport.authenticate('jwt', {session: false}), function (req, res) {
        var currentId = req.params.id;
        var idToUnfollow = req.body.idToUnfollow;

        User.findByIdAndUpdate(currentId, {$pull: {following: idToUnfollow}}, function (err, product) {
            if (err) {
                res.status(500).json({message: err || err.name || "Unknown server error", data: []});
            } else {
                User.findByIdAndUpdate(idToUnfollow, {$pull: {followers: currentId}}, {new: true}, function (err, newUser) {
                    if (err) {
                        res.status(500).json({message: err || err.name || "Unknown server error", data: []});
                    } else {
                        res.status(200).json({message: "resource updated", data: newUser});
                    }
                });
            }
        });
    });


    // this is for adding an user to an event guest list
    router.put('/events/:id/adduser', passport.authenticate('jwt', {session: false}), function (req, res) {
        var eventId = req.params.id;
        var userId = req.body.userId;

        Event.findByIdAndUpdate(eventId, {$addToSet: {guests: userId}}, {new: true}, function (err, newEvent) {
            if (err) {
                res.status(500).json({message: err, data: []});
            } else {
                User.update({_id: userId}, {$addToSet: {eventsAttended: eventId}}, function (err, product) {
                    if (err) {
                        res.status(500).json({message: err, data: []});
                    } else {
                        res.status(200).json({message: "resource updated", data: newEvent});
                    }
                });
            }
        });
    });


    // this is for removing an user from an event guest list
    router.put('/events/:id/removeuser', passport.authenticate('jwt', {session: false}), function (req, res) {
        var eventId = req.params.id;
        var userId = req.body.userId;

        Event.findByIdAndUpdate(eventId, {$pull: {guests: userId}}, {new: true}, function (err, newEvent) {
            if (err) {
                res.status(500).json({message: err || err.name || "Unknown server error", data: []});
            } else {
                User.update({_id: userId}, {$pull: {eventsAttended: eventId}}, function (err, product) {
                    if (err) {
                        res.status(500).json({message: err || err.name || "Unknown server error", data: []});
                    } else {
                        res.status(200).json({message: "resource updated", data: newEvent});
                    }
                });
            }
        });
    });

    // this is for adding an user to an invite request list
    router.put('/invites/:id/adduser', passport.authenticate('jwt', {session: false}), function (req, res) {
        var inviteId = req.params.id;
        var userId = req.body.userId;

        Invite.findByIdAndUpdate(inviteId, {
            $push: {
                request: {
                    userId: userId,
                    timestamp: Date.now(),
                    status: 'pending'
                }
            }
        }, {new: true}, function (err, product) {
            if (err) {
                res.status(500).json({message: err, data: []});
            } else {
                res.status(200).json({message: "invite request updated", data: product});
            }
        });
    });

    // this is for removing an user from an invite request list
    router.put('/invites/:id/removeuser', passport.authenticate('jwt', {session: false}), function (req, res) {
        var inviteId = req.params.id;
        var userId = req.body.userId;

        Invite.findByIdAndUpdate(inviteId, {$pull: {request: {userId: userId}}}, {new: true}, function (err, product) {
            if (err) {
                res.status(500).json({message: err, data: []});
            } else {
                res.status(200).json({message: "invite request removed", data: product});
            }
        });
    });

    // this is for updating an user's status in an invite request list
    router.put('/invites/:id/updateuser', passport.authenticate('jwt', {session: false}), function (req, res) {
        var inviteId = req.params.id;
        var userId = req.body.userId;
        var userStatus = req.body.userStatus;

        Invite.findOneAndUpdate({
            _id: inviteId,
            request: {$elemMatch: {userId: userId}}
        }, {$set: {"request.$.status": userStatus}}, {new: true}, function (err, product) {
            if (err) {
                res.status(500).json({message: err, data: []});
            } else {
                res.status(200).json({message: "invite request updated", data: product});
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
        // for getting each event, we want to populate its invite and address:
        Event.findOne({_id: req.params.id}).populate('invite').exec(function (err, populatedEvent) {
            if (err || !populatedEvent) {
                res.status(404).json({message: "Unable to retrieve event"});
            } else {
                res.status(200).json({message: "OK", data: populatedEvent});
            }
        });
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


    // customized end point
    router.get('/users/:id', passport.authenticate('jwt', {session: false}), function (req, res) {
        getSingleResource(User, req, res);
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