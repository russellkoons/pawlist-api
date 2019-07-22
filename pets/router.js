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

router.post('/', (req, res) => {
  if (!('name' in req.body)) {
    const message = 'Missing name is request body';
    console.error(message);
    return res.status(400).send(message);
  }

  Pet.create({
    user: req.body.user,
    name: req.body.name,
    info: req.body.info,
    vet: req.body.info,
    pic: req.body.pic
  })
  .then(pet => res.status(201).json(pet.serialize()))
  .catch(err => {
    console.error(err);
    res.status(500).json({ error: 'not again!' });
  });
});

module.exports = { router };