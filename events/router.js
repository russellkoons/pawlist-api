'use strict';

const express = require('express');

const { Event } = require('../models');

const router = express.Router();

router.get('/', (req, res) => {
  Event
    .find()
    .then(events => {
      res.json(events.map(event => event.serialize()));
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Nooooo' });
    });
});

module.exports = { router };