'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const expect = chai.expect;

const { User } = require('../models');
const { app, runServer, closeServer } = require('../server');
const { TEST_DATABASE_URL, JWT_SECRET } = require('../config');

chai.use(chaiHttp);

describe('Testing the server', function() {
  it('should respond', function() {
    return chai
      .request(app)
      .get('/')
      .then(res => {
        expect(res).to.have.status(202);
      });
  });
});