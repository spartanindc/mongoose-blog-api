'use strict';

const mongoose = require('mongoose');

//Schema
const blogpostSchema = mongoose.Schema({
  title: {type: String, required: true},
  author: {
    firstName: String,
    lastName: String,
    //required: true
  },
  content: {type: String, required: true},
  publicationDate: Date
});

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

module.exports = {BlogPosts};