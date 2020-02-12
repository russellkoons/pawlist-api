'use strict';

const express = require('express');
const moment = require('moment');

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
    date: moment().format('LL')
  })
  .then(rev => res.status(201).json(rev.serialize()))
  .catch(err => {
    console.error(err);
    res.status(500).json({ error: 'not again!' });
  });
});

module.exports = { router };