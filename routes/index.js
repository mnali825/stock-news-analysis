var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var passport = require('passport');
var User = mongoose.model('User');
var googleFinance = require('google-finance');
var sentiment = require('sentiment');

router.get('/', function(req, res) {
  var watchlist;
  if (req.user) {
    res.render('index', { user: req.user });  
  } else {
    watchlist = ['NASDAQ:AMZN', 'NASDAQ:BABA', 'NASDAQ:FB', 'NASDAQ:TSLA'];
  }

  googleFinance.companyNews({
    symbols:watchlist
  }, function(err, news) {
    if (!err) {
      var newsarray = getMultipleStockNews(news);

      var tickerlist = [];
      watchlist.forEach(function(stock) {
        tickerlist.push(stock.split(':')[1]);
      });

      var newsCompanies = [];
      newsarray.forEach(function(article) {
        newsCompanies.push(article.link.split("//")[1].split('.com')[0]);
      });
      console.log(newsCompanies);
      newsarray.sort(byDate);
      res.render('index', {newsarray:newsarray, watchlist:tickerlist});
    } else {

    }
  });
  
});

router.get('/login', function(req, res) {
  res.render('login');
});

router.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

router.post('/login', function(req,res,next) {
  // NOTE: use the custom version of authenticate so that we can
  // react to the authentication result... and so that we can
  // propagate an error back to the frontend without using flash
  // messages
  passport.authenticate('local', function(err,user) {
    if(user) {
      // NOTE: using this version of authenticate requires us to
      // call login manually
      req.logIn(user, function(err) {
        res.redirect('/users/' + user.username);
      });
    } else {
      res.render('login', {message:'Your login or password is incorrect.'});
    }
  })(req, res, next);
  // NOTE: notice that this form of authenticate returns a function that
  // we call immediately! See custom callback section of docs:
  // http://passportjs.org/guide/authenticate/
});

router.get('/register', function(req, res) {
  res.render('register');
});

router.post('/register', function(req, res) {
  User.register(new User({username:req.body.username, fname:req.body.fname, lname:req.body.lname}), 
    req.body.password, function(err, user){
    if (err) {
      // NOTE: error? send message back to registration...
      res.render('register',{message:'Your username or password is already taken'});
    } else {
      // NOTE: once you've registered, you should be logged in automatically
      // ...so call authenticate if there's no error
      passport.authenticate('local')(req, res, function() {
        res.redirect('/users/' + req.user.username);
      });
    }
  });   
});

router.get('/users/:username', function(req, res) {
  // NOTE: use populate() to retrieve related documents and 
  // embed them.... notice the call to exec, which executes
  // the query:
  // - http://mongoosejs.com/docs/api.html#query_Query-populate
  // - http://mongoosejs.com/docs/api.html#query_Query-exec
  User
    .findOne({username: req.params.username})
    .populate('images').exec(function(err, user) {
    // NOTE: this allows us to conditionally show a form based
    // on whether or not they're on "their page" and if they're
    // logged in:
    //
    // - is req.user populated (yes means they're logged in and we 
    // have a user
    // - is the authenticated user the same as the user that we
    // retireved by looking at the slug?
    
    // var showForm = !!req.user && req.user.username == user.username;
    res.render('user', { 
      // showForm: showForm, 
      images: user.images, 
      username: user.username
    });
  });
});

router.get('/api/get-news', function(req,res) { 
  var watchlist;
  if (req.user) {

  } else {
    watchlist = ['NASDAQ:AMZN', 'NASDAQ:BABA', 'NASDAQ:FB', 'NASDAQ:TSLA'];
    watchlist.push(req.query.ticker);
  }
  googleFinance.companyNews({
    symbols: watchlist
  }, function(err, news) {
    if (!err) {
      var newsarray = getMultipleStockNews(news);
      newsarray.sort(byDate);
      res.json(newsarray.map(function(ele) {
        return {
          "symbol":ele.symbol,
          "title":ele.title,
          "description":ele.description,
          "summary":ele.summary,
          "date":ele.date,
          "link":ele.link,
          "sentiment":sentiment(ele.summary)
        }
      }));
    } else {

    }
  });
});


function getSingleStockNews(news) {
  var newsarray = [];
  for (article in news) {
    newsarray.push(news[article]);
  }
  return newsarray;
}

function getMultipleStockNews(news) {
  var newsarray = [];
  for (stock in news) {
    var data = news[stock];
    data.forEach(function(ele) {
      ele.sentiment = sentiment(ele.summary);
      newsarray.push(ele);
    });
  }
  return newsarray;
}

function byDate(a,b) {
  var dateA = new Date(a.date);
  var dateB = new Date(b.date);
  return dateB-dateA;
}

module.exports = router;
