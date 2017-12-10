"use strict";

// load dependancies

const path = require('path'),
    express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    session = require('express-session');

// Define Logic

app.set('view engine', 'ejs'); // render files in Embedded JavaScript
app.use(express.static('public')); // allow for static file serving
app.set('trust proxy', 1); // trust first incoming proxy
app.use(session({ // Initialize login session
    secret: '14221303',
    resave: true,
    saveUninitialized: true,
    cookie: { secure: true }
}));
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}));

app.use((req, res, next) => { // ensure using HTTPS
    if (req.secure) 
        return next();
    res.redirect('https://' + req.hostname + req.url); // express 4.x
});

require('./database').init(app); // Initialize database

// Set up Connections

app.get('/', (req, res) => {
    if (req.session.user) res.render(path.resolve(__dirname, '../views', 'dashboard.ejs')); // if logged in
    else res.render(path.resolve(__dirname, '../views', 'index.ejs')); // if not logged in
});

app.get('/login', (req, res) => res.render(path.resolve(__dirname, '../views', 'login.ejs')));

app.get('/register', (req, res) => res.render(path.resolve(__dirname, '../views', 'register.ejs')));

app.get('/play', (req, res) => {
    if (req.session.user) res.render(path.resolve(__dirname, '../views', 'play.ejs'));
    else res.redirect('/login');
});

// Start App

app.listen(process.env.PORT || 8080, () => {
    console.log('App started');
});
