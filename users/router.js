'use strict';

// Router to create a new User

const express = require('express');
const bodyParser = require('body-parser');

const { User } = require('../models');

const router = express.Router();

const jsonParser = bodyParser.json();

router.post('/', jsonParser, (req, res) => {
  const trimmedFields = ['username', 'password'];
  const notTrimmed = trimmedFields.find(field => req.body[field].trim() !== req.body[field]);

  if (notTrimmed) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Username or Password cannot have whitespace',
      location: notTrimmed
    });
  }

  let { username, password } = req.body;

  return User.find({username})
    .countDocuments()
    .then(count => {
      if (count > 0) {
        return Promise.reject({
          code: 422,
          reason: 'ValidationError',
          message: 'Username already in use',
          location: 'username'
        });
      }
      return User.hashPassword(password);
    })
    .then(hash => {
      return User.create({
        username,
        password: hash
      });
    })
    .then(user => {
      return res.status(201).json(user.serialize());
    })
    .catch(err => {
      if (err.reason === 'ValidationError') {
        return res.status(err.code).json(err);
      }
      res.status(500).json({code: 500, message: 'Internal server error'});
    });
});

module.exports = { router };