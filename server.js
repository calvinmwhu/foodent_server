// Get the packages we need
var express = require('express');
var mongoose = require('mongoose');
var config = require('./config/database');
var passport = require('passport');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');
var jwt = require('jwt-simple');
var router = express.Router();
//var User = require('./models/user');
//var Event = require('./models/event');
//var Image = require('./models/image');
//var Invite = require('./models/invite');

mongoose.connect(config.database, function (err) {
    if (err) {
        console.log('Connection Error: ', err);
    } else {
        console.log('Connection Succeeded');
    }
});


// Create our Express application
var app = express();

// Use environment defined port or 4000
var port = process.env.PORT || 4000;

//Allow CORS so that backend and frontend could pe put on different servers
var allowCrossDomain = function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header("Access-Control-Allow-Headers", "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Authorization");
    next();
};

app.use(allowCrossDomain);
// Use the body-parser package in our application
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use(morgan('dev'));
app.use(cookieParser());
app.use(passport.initialize());
require('./config/passport')(passport);

// All our routes will start with /api
app.use('/api', router);
var homeRoute = router.route('/');
homeRoute.get(function (req, res) {
    res.json({message: 'Hello Welcome to Foodent API!', data: [] });
});

require('./app/routes.js')(router, passport);

// Start the server
app.listen(port);
console.log('Server running on port ' + port);
