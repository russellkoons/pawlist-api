'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const expect = chai.expect;

const { Pet, User } = require('../models');
const { app, runServer, closeServer } = require('../server');
const { TEST_DATABASE_URL, JWT_SECRET } = require('../config');

chai.use(chaiHttp);

function seedPets() {
  
}

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

    it('Should create a new user', function() {
      return chai
        .request(app)
        .post('/users')
        .send({
          username,
          password
        })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('username');
          expect(res.body.username).to.equal(username);
          return User.findOne({ username });
        })
        .then(user => {
          expect(user).to.not.be.null;
          return user.validatePassword(password);
        })
        .then(correct => {
          expect(correct).to.be.true;
        });
    });
  });
});

describe('Auth Router', function() {
  const username = 'testUser';
  const password = 'uuuggghHHHH';

  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  after(function() {
    return closeServer();
  });

  beforeEach(function() {
    return User.hashPassword(password).then(password => 
      User.create({
        username,
        password
      })
    );
  });

  afterEach(function() {
    return User.deleteOne({ username: 'testUser' });
  });

  describe('Login', function() {
    it('Should reject empty requests', function() {
      return chai
        .request(app)
        .post('/auth/login')
        .catch(err => {
          const res = err.response;
          expect(res).to.have.status(400);
        });
    });
    it('should reject incorrect usernames', function() {
      return chai
        .request(app)
        .post('/auth/login')
        .send({ username: 'wrongo', password })
        .catch(err => {
          const res = err.response;
          expect(res).to.have.status(401);
        });
    });
    it('should reject incorrect passwords', function() {
      return chai
        .request(app)
        .post('/auth/login')
        .send({ username, password: 'wrongo' })
        .catch(err => {
          const res = err.response;
          expect(res).to.have.status(401);
        });
    });
    it('should return a valid auth token', function() {
      return chai
        .request(app)
        .post('/auth/login')
        .send({ username, password })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.a('object');
          const token = res.body.authToken;
          expect(token).to.be.a('string');
          const payload = jwt.verify(token, JWT_SECRET, {
            algorithm: ['HS256']
          });
          expect(payload.user).to.deep.equal({username});
        });
    });
  });

  describe('Refresh', function(){
    it('should reject empty requests', function() {
      return chai
        .request(app)
        .post('/auth/refresh')
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          expect(res).to.have.status(401);
        });
    });
    it('should reject invalid tokens', function() {
      const token = jwt.sign(
        {
          username
        },
        'wrongofriendo',
        {
          algorithm: 'HS256',
          expiresIn: '7d'
        }
      );
      return chai
        .request(app)
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${token}`)
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          expect(res).to.have.status(401);
        });
    });
    it('should reject expired tokens', function() {
      const token = jwt.sign(
        {
         username
        },
        JWT_SECRET,
        {
          algorithm: 'HS256',
          expiresIn: Math.floor(Date.now() / 1000) - 10
        }
      );
      return chai
        .request(app)
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${token}`)
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          expect(res).to.have.status(401);
        });
    });
    it('should return a newer token', function() {
      return chai
      .request(app)
      .post('/auth/login')
      .send({ username, password })
      .then(res => {
        const decoded = jwt.decode(res.body.authToken);
        return chai
          .request(app)
          .post('/auth/refresh')
          .set('Authorization', `Bearer ${res.body.authToken}`)
          .then(_res => {
            expect(_res).to.have.status(200);
            expect(_res.body).to.be.a('object');
            const token = _res.body.authToken;
            expect(token).to.be.a('string');
            const payload = jwt.verify(token, JWT_SECRET, {
              algorithm: ['HS256']
            });
            expect(payload.user).to.deep.equal({username});
            expect(payload.exp).to.be.at.least(decoded.exp);
          });
      });
    });
  });
});