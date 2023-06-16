const express = require('express');
const cookieSession = require('cookie-session');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const { getUserByEmail } = require('./helpers');
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

let urlDatabase = {
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
  const urlDatabaseKeys = Object.keys(urlDatabase);
  for (const key of urlDatabaseKeys) {
    if (id === urlDatabase[key].userID) {
      if (urls === undefined) {
        urls = { [key]: urlDatabase[key].longURL };
      } else {
        urls = Object.assign(urls, { [key]: urlDatabase[key].longURL });
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
    urls: urlDatabase,
    user: users[req.session["user_id"]]
  };
  res.render('urls_new', templateVars);
});

app.get('/register', (req, res) => {
  if (users[req.session["user_id"]]) {
    res.redirect('/urls');
  }

  const templateVars = {
    urls: urlDatabase,
    user: users[req.session["user_id"]]
  };
  res.render('register', templateVars);
});

app.get('/login', (req, res) => {
  if (users[req.session["user_id"]]) {
    res.redirect('/urls');
  }

  const templateVars = {
    urls: urlDatabase,
    user: users[req.session["user_id"]]
  };
  res.render('login', templateVars);
});

app.get('/urls/:id', (req, res) => {
  if (!users[req.session["user_id"]]) {
    return res.status(401).send('Please log in');
  }

  const ownedUrls = urlsForUser(users[req.session["user_id"]].id);
  if (!ownedUrls || !ownedUrls[req.params.id]) {
    return res.status(401).send('Unauthorized');
  }

  if (!urlDatabase[req.params.id]) {
    return res.status(404).send('Shortened URL not found\n');
  }

  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: users[req.session["user_id"]]
  };
  res.render('urls_show', templateVars);
});

app.get('/u/:id', (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send('Shortened URL not found\n');
  }

  const longURL = urlDatabase[req.params.id].longURL;
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

  let newUrlID = generateRandomString();
  urlDatabase = Object.assign(urlDatabase, {
    [newUrlID]: {
      longURL: req.body.longURL,
      userID: users[req.session["user_id"]].id
    }
  });
  res.redirect(`/urls/${newUrlID}`);
});

app.post('/urls/:id/delete', (req, res) => {
  if (!req.session["user_id"]) {
    return res.status(401).send('Please log in or register\n');
  }

  const urlID = urlDatabase[req.params.id];
  if (!urlID) {
    return res.status(404).send('ID not found\n');
  }

  const urls = urlsForUser(req.session["user_id"]);
  if (urls === undefined) {
    return res.status(401).send('Unauthorized\n');
  }

  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

app.post('/urls/:id', (req, res) => {
  const urlID = urlDatabase[req.params.id];
  if (!urlID) {
    return res.status(404).send('ID not found\n');
  }

  if (!req.session["user_id"]) {
    return res.status(401).send('Please log in or register\n');
  }

  const ownedUrls = urlsForUser(req.session["user_id"]);
  if (!ownedUrls || !ownedUrls[req.params.id]) {
    return res.status(401).send('Unauthorized\n');
  }

  urlDatabase[req.params.id].longURL = req.body.newUrl;
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send('Please enter email address/password');
  }

  if (!getUserByEmail(email, users)) {
    return res.status(403).send('The email address is not registered');
  }

  const user = getUserByEmail(email, users);
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
    return res.status(400).send('Please enter email and password');
  }

  if (getUserByEmail(email, users)) {
    return res.status(400).send('A user with that email already exists');
  }

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);
  const newUser = {
    id: id,
    email: email,
    password: hashedPassword
  };
  users[id] = newUser;

  req.session.user_id = users[id].id;
  res.redirect('/urls');
});

app.get('/', (req, res) => {
  if (!users[req.session["user_id"]]) {
    res.redirect('/login');
  }
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});