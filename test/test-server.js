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

describe('User Router', function() {
  const username = 'testUser';
  const password = 'password';

  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  after(function() {
    return closeServer();
  });

  afterEach(function() {
    return User.deleteOne({ username: 'testUser' });
  });

  describe('POST', function() {
    it('Should reject non-trimmed usernames', function() {
      return chai
        .request(app)
        .post('/users')
        .send({
          username: ` ${username} `,
          password
        })
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response.body;
          expect(res).to.have.status(422);
          expect(res.reason).to.equal('ValidationError');
          expect(res.message).to.equal('Username or Password cannot have whitespace');
          expect(res.location).to.equal('username');
        });
    });
  });
});