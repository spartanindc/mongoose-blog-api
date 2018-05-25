'use strict';

const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');

app.use(morgan('common'))

mongoose.Promise = global.Promise;

const { DATABASE_URL, PORT } = require('./config');
const { BlogPosts } = require('./models');

console.log(DATABASE_URL);
console.log(PORT);

const app = express();
app.use(express.json());

//Get
app.get('/blog-posts', (req, res) => {
  BlogPosts
    .find()
    .then(posts => {
      res.json({
        posts: posts.map(
        (posts) => post.serialize())
      });
  })
  .catch(err => {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  });
});

//Post
app.post('blog-posts', (req,res) => {
  
  const requiredFields = ['title', 'author', 'content'];
  for (let i=0; i < requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\' in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  }
  
  BlogPosts
    .create({
    title: req.body.title,
    author: req.body.author,
    content: req.body.content
  })
  .then(blogposts => res.status(201).json(blogposts.serialize()))
  .catch(err => {
    console.error(err);
    res.status(500).json({message: 'Internal server error'});
  });
});

//Put

app.put('blog-posts/:id', (req, res) => {
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    const message = (
      `Request path id (${req.params.id}) and request body id ` +
      `(${req.body.id}) must match`);
    console.error(message);
    return res.status(400).json({ message: message });
  }
  const toUpdate = {};
  const updateableFields = ['title', 'author', 'content'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });
  BlogPosts
    .findByIdAndUpdate(req.params.id, { $set: toUpdate })
    .then(blogposts => res.status(204).end())
    .catch(err => res.status(500).json({ message: 'Internal server error' }));
});

//Delete

app.delete('/blog-posts/:id', (req, res) => {
  BlogPosts
    .findByIdAndRemove(req.params.id)
    .then(blogposts => res.status(204).end())
    .catch(err => res.status(500).json({ message: 'Internal server error' }));
});

//catch-all endpoint
app.use('*', function (req, res) {
  res.status(404).json({message: 'Not Found'});
});

//Server stuff

let server;

function runServer(databaseUrl, port = PORT) {
  
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
        .on('error', err => {
          console.log('Fatal Err: ' + err);
          mongoose.disconnect();
          reject(err);
      });
    });
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if (err) {
          return reject(err);
        }
      });
    });
  });
}

if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer }: