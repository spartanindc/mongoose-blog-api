'use strict';

const mongoose = require('mongoose');

//Schema
const blogpostSchema = mongoose.Schema({
  title: {
    type: 'string', 
    required: true},
  author: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Author'
  },
  content: {
    type: 'string', 
    required: true},
  publicationDate: Date,
  comments: [commentSchema]
});

const authorSchema = mongoose.Schema({
  firstName: 'string',
  lastName: 'string',
  userName: {
    type: 'string',
    unique: true
  }
});

const commentSchema = mongoose.Schema({ 
  content: 'string'});

//Virtual

blogpostSchema.virtual('authorName').get(function() {
  return `${this.author.firstName} ${this.author.lastName}`.trim()
});

//Serialize

blogpostSchema.methods.serialize = function() {
  
  return {
    id: this._id,
    title: this.title,
    author: this.authorName,
    content: this.content,
    publicationDate: this.publicationDate
  };
}

const BlogPosts = mongoose.model('BlogPosts', blogpostSchema);
const Author = mongoose.model('Author', authorSchema);

module.exports = {BlogPosts};