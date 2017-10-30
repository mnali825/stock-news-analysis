var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');
var User = new mongoose.Schema({
  // images:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Image' }]
  username:String,
  password:String,
  fname:String,
  lname:String
});

// var Image = new mongoose.Schema({
//   user: {type: mongoose.Schema.Types.ObjectId, ref:'User'},
//   url: {type:String, required: true},
// });

// NOTE: we're using passport-local-mongoose as a plugin
// our schema for user looks pretty thin... but that's because
// the plugin inserts salt, password and username
User.plugin(passportLocalMongoose);
mongoose.model('User', User)
// mongoose.model('Image', Image)


mongoose.connect('mongodb://localhost/stock-news');
