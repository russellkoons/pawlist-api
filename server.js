'use strict';

// Basic setup

require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const passport = require('passport');
const mongoose = require('mongoose');

mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

const { router: usersRouter } = require('./users');
const { router: authRouter, local, jwt } = require('./auth');
const { router: petRouter } = require('./pets');
const { router: eventRouter } = require('./events');
const { router: reviewRouter } = require('./roadie');

mongoose.Promise = global.Promise;

const { DATABASE_URL, PORT } = require('./config');

const app = express();

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Origin', 'Content-Type,Authorization');
  res.header('Access-Control-Allow-Origin', 'GET,POST,PUT,DELETE');
  if (req.method === 'OPTIONS') {
    return res.send(204);
  }
  next();
});

// Setting the routes

app.use(express.static('public'));
app.use(express.json());
app.use(morgan('common'));
app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/pets', petRouter);
app.use('/events', eventRouter);
app.use('/roadie', reviewRouter);


passport.use(local);
passport.use(jwt);

const jwtAuth = passport.authenticate('jwt', { session: false });

app.get('/secret', jwtAuth, (req, res) => {
  return res.json({
    data: 'It\'s a secret to everyone!'
  });
});

app.get('*', (req, res) => {
  return res.status(202).json({ data: 'Hello there' });
});

// Functions to open and close the server

let server;

function runServer(databaseUrl, port = PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, { useNewUrlParser: true}, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`App listening on port ${port}`);
        resolve();
      })
        .on('error', err => {
          mongoose.disconnect();
          reject(err);
        });
    });
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer };