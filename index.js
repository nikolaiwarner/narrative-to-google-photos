require('dotenv').config();
var request = require('request');
var express = require('express');
var session = require('express-session')
var app = express();

app.set('view engine', 'html');
app.engine('html', require('hbs').__express);

app.use(session({
  secret: process.env.session_secret,
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60000 }
}));

app.get('/', function (req, res) {
  var status = "Status: <br>";
  if (req.session.narrative_oauth_code) {
    status += "Narrative Permission: " + req.session.narrative_oauth_code + " <br>"
  }
  if (req.session.narrative_token) {
    status += "Narrative API Token: " + req.session.narrative_token + " <br>"

    // fetchTodaysVideos(req);
  }

  res.render('index', {session: session});
});

app.get('/narrative/oauth', function (req, res) {
  // Get permission from user
  var url = "https://narrativeapp.com/oauth2/authorize/?redirect_uri=" +
            process.env.narrative_oauth_redirect_uri +
            "&response_type=code&client_id=" + process.env.narrative_client_id;
  res.redirect(url);
});

app.get('/narrative/oauth/callback', function (req, res) {
  req.session.narrative_oauth_code = req.query.code;

  var authString = "Basic " + new Buffer(process.env.narrative_client_id + ':' + process.env.narrative_client_secret).toString('base64');
  var options = {
    url: "https://narrativeapp.com/oauth2/token/",
    headers: {
      "Authorization": authString
    },
    formData: {
      grant_type: "client_credentials", //authorization_code
      code: req.session.narrative_oauth_code,
      redirect_uri: process.env.narrative_token_redirect_uri,
      client_id: process.env.narrative_client_id
    }
  };

  console.log(options);

  // Fetch a token
  request.post(options, function(err, httpResponse, body) {
    console.log(body);
    req.session.narrative_token = JSON.parse(body).access_token;

    fetchTodaysVideos(req);
    res.redirect('/');
  });
});

app.get('/narrative/token/callback', function (req, res) {
  req.session.narrative_token = res.token;
});

app.listen(80, function () {});



function fetchTodaysVideos(req) {
  console.log("fetchTodaysVideosfetchTodaysVideosfetchTodaysVideos");
  var options = {
    url: 'https://narrativeapp.com/api/v2/moments/',
    headers: {
      'Authorization': 'Bearer ' + req.session.narrative_token
    }
  };

  console.log(options);

  request.get(options, function(err, httpResponse, body) {
    console.log(body);
  })
}
