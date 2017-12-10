"use strict";

// Load Dependancies

const mongoose = require('mongoose'),
    md5 = require('md5');

// Define Logic

const Schema = mongoose.Schema;

const userSchema = new Schema({ // User blueprint
    username: String,
    password: String,
    joined: Date
});

let User = mongoose.model('users', userSchema);

// Initialize Database

module.exports.init = (app) => {

    mongoose.connect('mongodb://admin:hybridalpaca@ds243055.mlab.com:43055/grove'); // connect to DB

    // Route Incoming Connections

    app.post('/login', (req, res) => {
        let username = req.body.user,
            password = req.body.pass;
        User.findOne({ username, password: md5(password) }, (err, user) => {
            if (err) {
                console.warn(`LOGIN ERROR: ${err}`);
                res.redirect('/login?err=2');
            }
            else if (user) {
                req.session.user = user;
                res.redirect('/');
            }
            else res.redirect('/login?err=1');
        });
    });

    app.post('/register', (req, res) => {
        let username = req.body.user,
            password = req.body.pass;
        let user = new User();
        user.username = username;
        user.password = md5(password);
        user.joined = Date.now();
        user.save((err) => {
            if (err) {
                console.error(err);
                res.redirect('/register?err=2');
            }
            else {
                req.session.user = user;
                res.redirect('/');
            }
        });
    });

};
