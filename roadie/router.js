'use strict';

// Router for the pets database. Used to keep track of the stats and vet info for the user's pets

const express = require('express');

const { Review } = require('../models');

const router = express.Router();

router.get('/', (req, res) => {
  Review
    .find()
    .then(reviews => {
      res.json(reviews.map(review => review.serialize()));
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Oopsie' });
    });
});

router.post('/', (req, res) => {
  Review.create({
    user: req.body.user,
    title: req.body.title,
    rating: req.body.rating,
    review: req.body.review,
    date: req.body.date
  })
  .then(pet => res.status(201).json(pet.serialize()))
  .catch(err => {
    console.error(err);
    res.status(500).json({ error: 'not again!' });
  });
});

module.exports = { router };