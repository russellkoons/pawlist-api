'use strict';

// Router for Chores and Events for your pets

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

router.get('/:id', (req, res) => {
  Event
    .findById(req.params.id)
    .then(event => res.json(event.serialize()))
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Ruh roh' });
    });
});

router.post('/', (req, res) => {
  if (!('name' in req.body)) {
    const message = 'Missing name is request body';
    console.error(message);
    return res.status(400).send(message);
  }

  Event.create({
    user: req.body.user,
    name: req.body.name,
    info: req.body.info,
    date: req.body.date,
    frequency: req.body.frequency
  })
  .then(event => res.status(201).json(event.serialize()))
  .catch(err => {
    console.error(err);
    res.status(500).json({ error: 'Don\'t make me come over there' });
  });
});

router.put('/:id', (req, res) => {
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    res.status(400).json({
      error: 'Request path ID and body IDs must match'
    });
  }

  const updated = {
    name: req.body.name,
    info: req.body.info,
    date: req.body.date,
    frequency: req.body.frequency
  };

  Event
    .findByIdAndUpdate(req.params.id, { $set: updated }, { new: true })
    .then(event => res.status(201).json(event.serialize()))
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'uuugggggHHHHH' });
    });
});

router.delete('/:id', (req, res) => {
  Event
    .findByIdAndDelete(req.params.id)
    .then(() => {
      console.log('Deleting event ' + req.params.id);
      res.status(204).json({ message: 'Successful deletion' });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({ error: 'Deletion failed' });
    });
});

module.exports = { router };