'use strict';

// Router for JWT Authorization

const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const { JWT_SECRET } = require('../config');
const router = express.Router();

const createToken = function(user) {
  return jwt.sign({user}, JWT_SECRET, {
    subject: user.username,
    expiresIn: '7d',
    algorithm: 'HS256'
  });
};

const localAuth = passport.authenticate('local', { session: false });
router.use(bodyParser.json());

router.post('/login', localAuth, (req, res) => {
  const authToken = createToken(req.user.serialize());
  res.json({ authToken });
});

const jwtAuth = passport.authenticate('jwt', { session: false });

router.post('/refresh', jwtAuth, (req, res) => {
  const authToken = createToken(req.user);
  res.json({ authToken });
});

module.exports = { router };