'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const moment = require('moment');

const expect = chai.expect;

const { Event, Pet, User } = require('../models');
const { app, runServer, closeServer } = require('../server');
const { TEST_DATABASE_URL, JWT_SECRET } = require('../config');

chai.use(chaiHttp);

// Functions to seed and delete the dbs

function seedEvents() {
  console.info('Seeding events to the test server...');
  const seed = [];
  for (let i = 0; i < 5; i++) {
    seed.push(generateEvents());
  }
  return Event.insertMany(seed);
}

function generateEvents() {
  return {
    user: 'testUser',
    name: faker.random.word(),
    info: {
      pets: faker.random.words(),
      desc: faker.random.words()
    },
    date: moment().format(),
    frequency: 'Daily'
  }
}

function seedPets() {
  console.info('Seeding pets to the test server...');
  const seed = [];
  for (let i = 0; i < 5; i++) {
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

describe('Testing the server', () => {
  it('should respond', () => {
    return chai
      .request(app)
      .get('/')
      .then(res => {
        expect(res).to.have.status(202);
      });
  });
});

describe('Event Router', () => {
  before(() => {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(() => {
    return seedEvents();
  });

  afterEach(() => {
    return deleteDb();
  });

  after(() => {
    return closeServer();
  });

  describe('GET', () => {
    it('Should return events', () => {
      let res;
      return chai
        .request(app)
        .get('/events')
        .then(r => {
          res = r;
          expect(res).to.have.status(200);
          expect(res.body).to.have.lengthOf.at.least(1);
          return Event.countDocuments();
        })
        .then(count => {
          expect(res.body).to.have.length(count);
        });
    });

    it('Should have correct fields', () => {
      let resEvent;
      return chai
        .request(app)
        .get('/events')
        .then(res => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.lengthOf.at.least(1);
          res.body.forEach(event => {
            expect(event).to.be.a('object');
            expect(event).to.include.keys(
              'id', 'user', 'name', 'info', 'date', 'frequency'
            );
            expect(event.info).to.include.keys(
              'pets', 'desc'
            );
          });
          resEvent = res.body[0];
          return Event.findById(resEvent.id);
        })
        .then(event => {
          expect(resEvent.id).to.equal(event.id);
          expect(resEvent.user).to.equal(event.user);
          expect(resEvent.name).to.equal(event.name);
          expect(resEvent.info.pets).to.equal(event.info.pets);
          expect(resEvent.info.desc).to.equal(event.info.desc);
          expect(resEvent.date).to.equal(event.date);
          expect(resEvent.frequency).to.equal(event.frequency);
        });
    });
  });

  describe('POST', () => {
    it('Should add a new event', () => {
      const newEvent = generateEvents();
      return chai
        .request(app)
        .post('/events')
        .send(newEvent)
        .then(res => {
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys(
            'id', 'user', 'name', 'info', 'date', 'frequency'
          );
          expect(res.body.id).to.not.be.null;
          expect(res.body.user).to.equal(newEvent.user);
          expect(res.body.name).to.equal(newEvent.name);
          expect(res.body.info.pets).to.equal(newEvent.info.pets);
          expect(res.body.info.desc).to.equal(newEvent.info.desc);
          expect(res.body.date).to.equal(newEvent.date);
          expect(res.body.frequency).to.equal(newEvent.frequency);
          return Event.findById(res.body.id);
        })
        .then(event => {
          expect(event.user).to.equal(newEvent.user);
          expect(event.name).to.equal(newEvent.name);
          expect(event.info.pets).to.equal(newEvent.info.pets);
          expect(event.info.desc).to.equal(newEvent.info.desc);
          expect(event.date).to.equal(newEvent.date);
          expect(event.frequency).to.equal(newEvent.frequency);
        });
    });
  });

  describe('PUT', () => {
    it('Should update fields you send', () => {
      const updateData = generateEvents();
      return Event
        .findOne()
        .then(event => {
          updateData.id = event.id;
          return chai.request(app)
            .put(`/events/${event.id}`)
            .send(updateData);
        })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body.user).to.equal(updateData.user);
          expect(res.body.name).to.equal(updateData.name);
          expect(res.body.info.pets).to.equal(updateData.info.pets);
          expect(res.body.info.desc).to.equal(updateData.info.desc);
          expect(res.body.date).to.equal(updateData.date);
          expect(res.body.frequency).to.equal(updateData.frequency);
          return Event.findById(res.body.id);
        })
        .then(event => {
          expect(event.user).to.equal(updateData.user);
          expect(event.name).to.equal(updateData.name);
          expect(event.info.pets).to.equal(updateData.info.pets);
          expect(event.info.desc).to.equal(updateData.info.desc);
          expect(event.date).to.equal(updateData.date);
          expect(event.frequency).to.equal(updateData.frequency);
        });
    });
  });

  describe('DELETE', () => {
    it('Should delete event by id', () => {
      let event;
      return Event
        .findOne()
        .then(e => {
          event = e;
          return chai.request(app).delete('/events/' + event.id);
        })
        .then(res => {
          expect(res).to.have.status(204);
          return Event.findById(event.id);
        })
        .then(_e => {
          expect(_e).to.be.null;
        });
    });
  });
});

describe('Pet Router', () => {
  before(() => {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(() => {
    return seedPets();
  });

  afterEach(() => {
    return deleteDb();
  });

  after(() => {
    return closeServer();
  });

  describe('GET', () => {
    it('Should return pets', () => {
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

    it('Should have correct fields', () => {
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

  describe('POST', () => {
    it('Should add a new pet', () => {
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

  describe('PUT', () => {
    it('Should update fields you send', () => {
      const updateData = generatePets();
      return Pet
        .findOne()
        .then(pet => {
          updateData.id = pet.id;
          return chai.request(app)
            .put(`/pets/${pet.id}`)
            .send(updateData);
        })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body.name).to.equal(updateData.name);
          expect(res.body.info.petType).to.equal(updateData.info.petType);
          expect(res.body.info.breed).to.equal(updateData.info.breed);
          expect(res.body.info.weight).to.equal(updateData.info.weight);
          expect(res.body.vet.name).to.equal(updateData.vet.name);
          expect(res.body.vet.address).to.equal(updateData.vet.address);
          expect(res.body.vet.shots.rabies.date).to.equal(updateData.vet.shots.rabies.date);
          expect(res.body.vet.shots.rabies.frequency).to.equal(updateData.vet.shots.rabies.frequency);
          return Pet.findById(res.body.id);
        })
        .then(pet => {
          expect(pet.name).to.equal(updateData.name);
          expect(pet.info.petType).to.equal(updateData.info.petType);
          expect(pet.info.breed).to.equal(updateData.info.breed);
          expect(pet.info.weight).to.equal(updateData.info.weight);
          expect(pet.vet.name).to.equal(updateData.vet.name);
          expect(pet.vet.address).to.equal(updateData.vet.address);
          expect(pet.vet.shots.rabies.date).to.equal(updateData.vet.shots.rabies.date);
          expect(pet.vet.shots.rabies.frequency).to.equal(updateData.vet.shots.rabies.frequency);
        });
    });
  });

  describe('DELETE', () => {
    it('Should delete pet by id', () => {
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

describe('User Router', () => {
  const username = 'testUser';
  const password = 'password';

  before(() => {
    return runServer(TEST_DATABASE_URL);
  });

  after(() => {
    return closeServer();
  });

  afterEach(() => {
    return User.deleteOne({ username: 'testUser' });
  });

  describe('POST', () => {
    it('Should reject non-trimmed usernames', () => {
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

    it('Should reject non-trimmed passwords', () => {
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

    it('Should create a new user', () => {
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

describe('Auth Router', () => {
  const username = 'testUser';
  const password = 'uuuggghHHHH';

  before(() => {
    return runServer(TEST_DATABASE_URL);
  });

  after(() => {
    return closeServer();
  });

  beforeEach(() => {
    return User.hashPassword(password).then(password => 
      User.create({
        username,
        password
      })
    );
  });

  afterEach(() => {
    return User.deleteOne({ username: 'testUser' });
  });

  describe('Login', () => {
    it('Should reject empty requests', () => {
      return chai
        .request(app)
        .post('/auth/login')
        .catch(err => {
          const res = err.response;
          expect(res).to.have.status(400);
        });
    });

    it('should reject incorrect usernames', () => {
      return chai
        .request(app)
        .post('/auth/login')
        .send({ username: 'wrongo', password })
        .catch(err => {
          const res = err.response;
          expect(res).to.have.status(401);
        });
    });

    it('should reject incorrect passwords', () => {
      return chai
        .request(app)
        .post('/auth/login')
        .send({ username, password: 'wrongo' })
        .catch(err => {
          const res = err.response;
          expect(res).to.have.status(401);
        });
    });

    it('should return a valid auth token', () => {
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

  describe('Refresh', () =>{
    it('should reject empty requests', () => {
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

    it('should reject invalid tokens', () => {
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

    it('should reject expired tokens', () => {
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

    it('should return a newer token', () => {
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