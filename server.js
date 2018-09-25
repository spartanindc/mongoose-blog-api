'use strict';

const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');

mongoose.Promise = global.Promise;

const { DATABASE_URL, PORT } = require('./config');
const { Author, BlogPosts } = require('./models');

console.log(DATABASE_URL);
console.log(PORT);

const app = express();
app.use(express.json());
app.use(morgan('common'));

//Get Blog Posts
app.get('/blog-posts', (req, res) => {
  BlogPosts
    .find()
    .then(posts => {
      res.json({
        posts: posts.map(
        (posts) => {
          return {
          title: posts.title,
          content: posts.content,
          author: posts.authorName, 
          id: posts._id
        };
      }));
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'something went wrong' });
    });
});
  
app.get('/blog-posts/:id', (req, res) => {
  BlogPosts
    .findbyId(req.params.id)
    .then(posts => {
      res.json({
        posts: posts.map(
        (posts) => {
          return {
          title: posts.title,
          content: posts.content,
          author: posts.authorName, 
          id: posts._id,
          comments: posts.comments
        };
      }));
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'something went wrong' });
    });
});
  
//Get Authors
app.get('/authors', (req, res) => {
  Author
    .find()
    .then(authors => {
      res.json(authors.map(author => {
        return {
          id: author._id,
          name: `${author.firstName} ${author.lastName}`,
          userName: author.userName
        };
      }));
    })
    .catch(err => {
    console.error('Fatal Error ' + err);
    res.status(500).json({ message: 'Internal server error' });
    });
});

//Post Blog Posts
app.post('blog-posts', (req,res) => {
  
  const requiredFields = ['title', 'author_id', 'content'];
  for (let i=0; i < requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\' in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  }
  
  Author
    .findById(req.body.author_id)
    .then(author => {
      if (author) {
        BlogPosts
          .create({
          title: req.body.title,
          author: req.body.id,
          content: req.body.content
        })
        .then(blogposts => res.status(201).json(blogposts.serialize()))
        .catch(err => {
          console.error(err);
          res.status(500).json({message: 'Internal server error'});
        });
      }
      else {
        const message = `Author not found`;
        console.error(message);
        return res.status(400).send(message);
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'something wrong' });
    });
  });

//Put Blog posts

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
    .findByIdAndUpdate(req.params.id, { $set: toUpdate }, { new: true })
    .then(updatedPost => res.status(200).json({
      id: updatedPost.id,
      title: updatedPost.title,
      content: updatedPost.content
    }))
    .catch(err => res.status(500).json({ message: 'Internal server error' }));
});

//Delete

app.delete('/blog-posts/:id', (req, res) => {
  BlogPosts
    .findByIdAndRemove(req.params.id)
    .then(() => {
      console.log(`Deleted blog post with id \`${req.params.id}\``);
      res.status(204).end();
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

module.exports = { app, runServer, closeServer };