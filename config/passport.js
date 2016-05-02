//var LocalStrategy = require('passport-local').Strategy;
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var User = require('../app/models/user');
var config = require('../config/database');

module.exports = function(passport) {
    var options = {};
    options.secretOrKey = config.secret;
    options.jwtFromRequest = ExtractJwt.fromAuthHeader();
    passport.use(new JwtStrategy(options, function(jwt_payload, done) {

        User.findOne({_id: jwt_payload.id}, function(err, user) {
            if (err) {
                console.log("err: ", jwt_payload);
                return done(err, false);
            }
            if (user) {
                console.log("success: ", jwt_payload);
                done(null, user);
            } else {
                console.log("unauthorized: ", jwt_payload);
                done(null, false);
            }
        });
    }));
};
