'use strict';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;


const commentSchema = mongoose.Schema({ 
  content: 'string'});

//Schema
const blogpostSchema = mongoose.Schema({
  title: 'string', 
  author: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Author'
  },
  content: 'string', 
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



//Populate

blogpostSchema.pre('find', function(next) {
    this.populate('author');
    next();
})
blogpostSchema.pre('findOne', function(next) {
  this.populate('author');
  next();
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
    comments: this.comments
  };
}

const BlogPosts = mongoose.model('BlogPost', blogpostSchema);
let Author = mongoose.model('Author', authorSchema);

module.exports = {Author, BlogPosts};