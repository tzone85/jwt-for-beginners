var _ = require('lodash');
var express = require("express");
var bodyParser = require("body-parser");
var jwt = require('jsonwebtoken');

var passport = require("passport");
var passportJWT = require("passport-jwt");

var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;

var app = express();
app.use(passport.initialize());

// parse application/x-www-form-url-urlencoded
// for easier testing with Postman or plain HTML forms
app.use(bodyParser.urlencoded({
    extended: true
}));

// parse application/json
app.use(bodyParser.json());

var users = [
    {
        id: 1,
        name: 'mncedi',
        password: 'testing'
    },
    {
        id: 2,
        name: 'thando',
        password: 'testing'
    }
];


// passport jwt strategy
var jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
jwtOptions.sec_secretOrKeyProvider = 'thandomncedimini';

var strategy = new JwtStrategy(jwtOptions, function(jwt_payload, next) {
    console.log('payload received', jwt_payload);

    // normally the following would be a database call
    var user = users[_.findIndex((users, {id: jwt_payload.id}))];

    if (user) {
        next(null, user);
    } else {
        next(null, false);
    }
});

passport.use(strategy);

app.get("/", function (req, res) {
    res.json({message: "Express is up!"});
});

app.post("/login", function(req, res) {
    if (req.body.name && req.body.password) {
        var name = req.body.name;
        var password = req.body.password;
    }

    // usually this is a DB call
    var user = users[_.findIndex(users, {name: name})];
    if (! user ){
        res.status(401).json({message: "No such user found"});
    }

    if (user.password === req.body.password) {
        // from now on, we'll identify the user by the id and the id is the only personalized value going into our token
        var payload = {id: user.id};
        var token = jwt.sign(payload, jwtOptions.sec_secretOrKeyProvider);
        res.json({message: "ok", token: token});
    } else {
        res.status(401).json({message: "passwords did not match"});
    }
});

app.listen(3000, function () {
    console.log("Express running");
});