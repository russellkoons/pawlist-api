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
    vet: req.body.vet,
    pic: req.body.pic
  })
  .then(pet => res.status(201).json(pet.serialize()))
  .catch(err => {
    console.error(err);
    res.status(500).json({ error: 'not again!' });
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
    vet: req.body.vet,
    pic: req.body.pic
  };

  Pet
    .findByIdAndUpdate(req.params.id, { $set: updated }, { new: true })
    .then(pet => res.status(201).json(pet.serialize()))
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'What did you do?!' });
    });
});

router.delete('/:id', (req, res) => {
  Pet
    .findByIdAndDelete(req.params.id)
    .then(() => {
      console.log('Deleting pet ' + req.params.id);
      res.status(204).json({ message: 'Successful deletion' });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({ error: 'Deletion failed' });
    });
});

module.exports = { router };