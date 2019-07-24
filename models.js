'use strict';

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const eventSchema = mongoose.Schema({
  user: {type: String},
  name: {
    type: String,
    required: true
  },
  info: {type: Object},
  date: {type: String},
  frequency: {type: String}
});

eventSchema.methods.serialize = function() {
  return {
    id: this._id,
    user: this.user,
    name: this.name,
    info: this.info,
    date: this.date,
    frequency: this.frequency
  }
}

const petSchema = mongoose.Schema({
  user: {type: String},
  name: {
    type: String,
    required: true
  },
  info: {type: Object},
  vet: {type: Object},
  pic: {type: String}
});

petSchema.methods.serialize = function() {
  return {
    id: this._id,
    user: this.user,
    name: this.name,
    info: this.info,
    vet: this.vet,
    pic: this.pic
  }
}

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  }
});

userSchema.methods.serialize = function() {
  return {
    username: this.username || ''
  }
}

userSchema.methods.validatePassword = function(password) {
  return bcrypt.compare(password, this.password);
}

userSchema.statics.hashPassword = function(password) {
  return bcrypt.hash(password, 10);
}

const Event = mongoose.model('event', eventSchema);

const Pet = mongoose.model('pet', petSchema);

const User = mongoose.model('user', userSchema);

module.exports = { Event, Pet, User };