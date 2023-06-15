const express = require('express');
const cookieSession = require('cookie-session');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const helpers = require('./helpers');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieSession({
  name: 'session',
  keys: ['0dm1c', 'c91lo', 't23kf'],
  maxAge: 24 * 60 * 60 * 1000
}));

function generateRandomString() {
  return Math.random().toString(36).substring(2, 8);
}

let users = {
  N12m34: {
    id: "N12m34",
    email: "a@ca",
    password: "$2a$10$KXD.WHYBXVctxitM9IZC..xYYaE9uE9FL1kAXhVmV4XqRu31zxeCK", // 1111
  },
  Ab34c2: {
    id: "Ab34c2",
    email: "b@ca",
    password: "$2a$10$H.YsenE5/rWh0c.F9uVoIuHkxRpM/LrhEGQJRstyW1FSWw777sryO", // 1111
  },
};

let newUrlDatabase = {
  'b2xVn2': {
    longURL: "http://www.lighthouselabs.ca",
    userID: "N12m34",
  },
  '9sm5xK': {
    longURL: "https://www.google.ca",
    userID: "N12m34",
  },
};

const urlsForUser = function(id) {
  let urls;
  const urlDatabaseKeys = Object.keys(newUrlDatabase);

  for (const key of urlDatabaseKeys) {
    if (id === newUrlDatabase[key].userID) {
      if (urls === undefined) {
        urls = { [key]: newUrlDatabase[key].longURL };
      } else {
        urls = Object.assign(urls, { [key]: newUrlDatabase[key].longURL });
      }
    }
  }
  return urls;
};


app.get('/urls', (req, res) => {
  if (!users[req.session["user_id"]]) {
    return res.status(401).send('Please log in or register');
  }

  const urls = urlsForUser(users[req.session["user_id"]].id);
  const templateVars = {
    urls: urls,
    user: users[req.session["user_id"]]
  };
  res.render('urls_index', templateVars);

});

app.get('/urls/new', (req, res) => {

  if (!req.session["user_id"]) {
    res.redirect('/login');
  }

  const templateVars = {
    urls: newUrlDatabase,
    user: users[req.session["user_id"]]
  };
  res.render('urls_new', templateVars);
});

app.get('/register', (req, res) => {
  // const id = generateRandomString();
  // const newUser = { id, email: req.body.email, password: req.body.password };
  // Object.assign(users, { [id]: newUser });

  if (users[req.session["user_id"]]) {
    res.redirect('/urls');
  }

  const templateVars = {
    urls: newUrlDatabase,
    user: users[req.session["user_id"]]
  };
  res.render('register', templateVars);
});

app.get('/login', (req, res) => {
  if (users[req.session["user_id"]]) {
    res.redirect('/urls');
  }
  const templateVars = {
    urls: newUrlDatabase,
    user: users[req.session["user_id"]]
  };
  res.render('login', templateVars);
});

app.get('/urls/:id', (req, res) => {
  if (!users[req.session["user_id"]]) {
    return res.status(401).send('Please log in');
  }

  const urls = urlsForUser(users[req.session["user_id"]].id);
  if (urls === undefined) {
    return res.status(401).send('Unauthorized');
  }


  const templateVars = {
    id: req.params.id,
    longURL: newUrlDatabase[req.params.id].longURL,
    user: users[req.session["user_id"]]
  };
  res.render('urls_show', templateVars);
});

app.get('/u/:id', (req, res) => {
  if (!newUrlDatabase[req.params.id]) {
    return res.status(404).send('Shortened URL not found\n');
  }
  const longURL = newUrlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

app.get('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});

app.post('/urls', (req, res) => {
  if (!users[req.session["user_id"]]) {
    return res.status(401).send('Please log in to shorten URLs\n');
  }
  let newUrlId = generateRandomString();
  newUrlDatabase = Object.assign(newUrlDatabase, {
    [newUrlId]: {
      longURL: req.body.longURL,
      userID: users[req.session["user_id"]].id
    }
  });
  res.redirect(`/urls/${newUrlId}`);
});

app.post('/urls/:id/delete', (req, res) => {

  const urlID = newUrlDatabase[req.params.id];
  if (!urlID) {
    return res.status(404).send('ID not found\n');
  }

  if (!req.session["user_id"]) {
    return res.status(401).send('Please log in or register\n');
  }

  const urls = urlsForUser(req.session["user_id"]);
  if (urls === undefined) {
    return res.status(401).send('Unauthorized\n');
  }

  delete newUrlDatabase[req.params.id];
  res.redirect('/urls');
});

app.post('/urls/:id', (req, res) => {

  const urlID = newUrlDatabase[req.params.id];
  if (!urlID) {
    return res.status(404).send('ID not found\n');
  }

  if (!req.session["user_id"]) {
    return res.status(401).send('Please log in or register\n');
  }

  const urls = urlsForUser(req.session["user_id"]);
  if (urls === undefined) {
    return res.status(401).send('Unauthorized\n');
  }

  newUrlDatabase[req.params.id].longURL = req.body.newUrl;
  res.redirect('/urls');

});

app.post('/login', (req, res) => {

  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send('Please enter email address/password');
  }

  if (!helpers.getUserByEmail(email, users)) {
    return res.status(403).send('The email address is not registered');
  }

  const user = helpers.getUserByEmail(email, users);
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send('Password not match');
  }

  req.session.user_id = user.id;
  res.redirect('/urls');
});

app.post('/register', (req, res) => {

  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send('Please enter email address/password');
  }

  if (helpers.getUserByEmail(email, users)) {
    return res.status(400).send('The email address has been registered');
  }

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);
  const newUser = {
    id: id,
    email: email,
    password: hashedPassword
  };


  users[id] = newUser;
  console.log(users);

  req.session.user_id = users[id].id;
  res.redirect('/urls');
});

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});