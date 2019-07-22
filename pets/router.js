'use strict';

const express = require('express');

const { Pet } = require('../models');

const router = express.Router();

router.get('/', (req, res) => {
  Pet
    .find()
    .then(pets => {
      res.json(pets.map(pet => pet.serialize()));
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Oopsie' });
    });
});

router.get('/:id', (req, res) => {
  Pet
    .findById(req.params.id)
    .then(pet => res.json(pet.serialize()))
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Ruh roh' });
    });
});

module.exports = { router };