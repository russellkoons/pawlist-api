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
          const res = err.response;
          const body = res.body;
          expect(res).to.have.status(422);
          expect(body.reason).to.equal('ValidationError');
          expect(body.message).to.equal('Username or Password cannot have whitespace');
          expect(body.location).to.equal('username');
        });
    });

    it('Should reject non-trimmed passwords', function() {
      return chai
        .request(app)
        .post('/users')
        .send({
          username,
          password: ` ${password} `
        })
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          const body = res.body;
          expect(res).to.have.status(422);
          expect(body.reason).to.equal('ValidationError');
          expect(body.message).to.equal('Username or Password cannot have whitespace');
          expect(body.location).to.equal('password');
        });
    });

    it('Should reject too short usernames', function() {
      return chai
        .request(app)
        .post('/users')
        .send({
          username: 'a',
          password
        })
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          const body = res.body;
          expect(res).to.have.status(422);
          expect(body.reason).to.equal('ValidationError');
          expect(body.message).to.equal('Must be at least 2 characters long');
          expect(body.location).to.equal('username');
        });
    });

    it('Should reject too long usernames', function() {
      return chai
        .request(app)
        .post('/users')
        .send({
          username: 'ThisUserNameIsSoDangLongWhatTheHeck',
          password
        })
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          const body = res.body;
          expect(res).to.have.status(422);
          expect(body.reason).to.equal('ValidationError');
          expect(body.message).to.equal('Must be at most 16 characters long');
          expect(body.location).to.equal('username');
        });
    });

    it('Should reject too short passwords', function() {
      return chai
        .request(app)
        .post('/users')
        .send({
          username,
          password: 'short'
        })
        .then(res => {
          expect(res).to.have.status(422);
        })
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          const body = res.body;
          expect(res).to.have.status(422);
          expect(body.reason).to.equal('ValidationError');
          expect(body.message).to.equal('Must be at least 8 characters long');
          expect(body.location).to.equal('password');
        });
    });

    it('Should reject too long passwords', function() {
      return chai
        .request(app)
        .post('/users')
        .send({
          username,
          password: new Array(73).fill('a').join('')
        })
        .then(res => {
          expect(res).to.have.status(422);
        })
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          const body = res.body;
          expect(res).to.have.status(422);
          expect(body.reason).to.equal('ValidationError');
          expect(body.message).to.equal('Must be at most 72 characters long');
          expect(body.location).to.equal('password');
        });
    });
  });
});