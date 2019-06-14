const axios = require('axios');

const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');

const { authenticate } = require('../auth/authenticate');

const db = require('../database/dbConfig');

module.exports = server => {
  server.post('/api/register', register);
  server.post('/api/login', login);
  server.get('/api/jokes', authenticate, getJokes);
};

function register(req, res) {
  hash = bcrypt.hashSync(req.body.password, 8);

  console.log(hash);

  const user = {
    username: req.body.username,
    password: hash
  };

  db('users')
    .insert(user)
    .then(user => {
      res.status(201).json(user);
    })
    .catch(err => {
      res.status(500).json(err);
    });
}

function login(req, res) {
  return db('users')
    .where({ username: req.body.username })
    .first()
    .then(user => {
      if (bcrypt.compareSync(req.body.password, user.password)) {
        const token = generateToken(user);

        res.status(200).json({ message: `Welcome ${user.username}`, token });
      } else {
        res.status(400).json({ message: 'invalid credentials' });
      }
    })
    .catch(err => {
      res.status(500).json(err);
    });
}

function getJokes(req, res) {
  const requestOptions = {
    headers: { accept: 'application/json' }
  };

  axios
    .get('https://icanhazdadjoke.com/search', requestOptions)
    .then(response => {
      res.status(200).json(response.data.results);
    })
    .catch(err => {
      res.status(500).json({ message: 'Error Fetching Jokes', error: err });
    });
}

function generateToken(user) {
  const payload = {
    userId: user.id,
    username: user.username
  };

  options = {
    expiresIn: '1d'
  };

  return jwt.sign(payload, 'secret', options);
}
