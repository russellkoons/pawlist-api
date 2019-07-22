'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const moment = require('moment');

const expect = chai.expect;

const { Pet, User } = require('../models');
const { app, runServer, closeServer } = require('../server');
const { TEST_DATABASE_URL, JWT_SECRET } = require('../config');

chai.use(chaiHttp);

function seedPets() {
  console.info('Seeding pets to the test server');
  const seed = [];
  for (let i = 0; i <= 5; i++) {
    seed.push(generatePets());
  }
  return Pet.insertMany(seed);
}

function generatePets() {
  return {
    user: 'testUser',
    name: faker.random.word(),
    info: {
      petType: faker.random.word(),
      breed: faker.random.word(),
      weight: faker.random.number()
    },
    vet: {
      name: faker.random.word(),
      address: faker.random.words(),
      shots: {
        rabies: {
          date: moment().format(),
          frequency: 'Yearly'
        }
      }
    },
    pic: faker.random.word()
  }
}

function deleteDb() {
  console.warn('Deleting test database');
  return mongoose.connection.dropDatabase();
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

describe('Pet Router', function() {
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedPets();
  });

  afterEach(function() {
    return deleteDb();
  });

  after(function() {
    return closeServer();
  });

  describe('GET', function() {
    it('Should return pets', function() {
      let res;
      return chai
        .request(app)
        .get('/pets')
        .then(r => {
          res = r;
          expect(res).to.have.status(200);
          expect(res.body).to.have.lengthOf.at.least(1);
          return Pet.countDocuments();
        })
        .then(count => {
          expect(res.body).to.have.length(count);
        });
    });

    it('Should have correct fields', function() {
      let resPet;
      return chai
        .request(app)
        .get('/pets')
        .then(res => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.lengthOf.at.least(1);
          res.body.forEach(pet => {
            expect(pet).to.be.a('object');
            expect(pet).to.include.keys(
              'id', 'user', 'name', 'info', 'vet', 'pic'
            );
            expect(pet.info).to.include.keys(
              'petType', 'breed', 'weight'
            );
            expect(pet.vet).to.include.keys(
              'name', 'address', 'shots'
            );
          });
          resPet = res.body[0];
          return Pet.findById(resPet.id);
        })
        .then(pet => {
          expect(resPet.id).to.equal(pet.id);
          expect(resPet.user).to.equal(pet.user);
          expect(resPet.name).to.equal(pet.name);
          expect(resPet.info.petType).to.equal(pet.info.petType);
          expect(resPet.info.breed).to.equal(pet.info.breed);
          expect(resPet.info.weight).to.equal(pet.info.weight);
          expect(resPet.vet.name).to.equal(pet.vet.name);
          expect(resPet.vet.address).to.equal(pet.vet.address);
          expect(resPet.vet.shots.rabies.date).to.equal(pet.vet.shots.rabies.date);
          expect(resPet.vet.shots.rabies.frequency).to.equal(pet.vet.shots.rabies.frequency);
          expect(resPet.pic).to.equal(pet.pic);
        });
    });
  });

  describe('POST', function() {
    it('Should add a new pet', function() {
      const newPet = generatePets();
      return chai
        .request(app)
        .post('/pets')
        .send(newPet)
        .then(res => {
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys(
            'id', 'user', 'name', 'info', 'vet', 'pic'
          );
          expect(res.body.id).to.not.be.null;
          expect(res.body.user).to.equal(newPet.user);
          expect(res.body.name).to.equal(newPet.name);
          expect(res.body.info.petType).to.equal(newPet.info.petType);
          expect(res.body.info.breed).to.equal(newPet.info.breed);
          expect(res.body.info.weight).to.equal(newPet.info.weight);
          expect(res.body.vet.name).to.equal(newPet.vet.name);
          expect(res.body.vet.address).to.equal(newPet.vet.address);
          expect(res.body.vet.shots.rabies.date).to.equal(newPet.vet.shots.rabies.date);
          expect(res.body.vet.shots.rabies.frequency).to.equal(newPet.vet.shots.rabies.frequency);
          return Pet.findById(res.body.id);
        })
        .then(pet => {
          expect(pet.user).to.equal(newPet.user);
          expect(pet.name).to.equal(newPet.name);
          expect(pet.info.petType).to.equal(newPet.info.petType);
          expect(pet.info.breed).to.equal(newPet.info.breed);
          expect(pet.info.weight).to.equal(newPet.info.weight);
          expect(pet.vet.name).to.equal(newPet.vet.name);
          expect(pet.vet.address).to.equal(newPet.vet.address);
          expect(pet.vet.shots.rabies.date).to.equal(newPet.vet.shots.rabies.date);
          expect(pet.vet.shots.rabies.frequency).to.equal(newPet.vet.shots.rabies.frequency);
        });
    });
  });

  describe('DELETE', function() {
    it('Should delete pet by id', function() {
      let pet;
      return Pet
        .findOne()
        .then(p => {
          pet = p;
          return chai.request(app).delete('/pets/' + pet.id);
        })
        .then(res => {
          expect(res).to.have.status(204);
          return Pet.findById(pet.id);
        })
        .then(_pet => {
          expect(_pet).to.be.null;
        });
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