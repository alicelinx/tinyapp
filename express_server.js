const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

function generateRandomString() {
  return Math.random().toString(36).substring(2, 8);
}

let foundUser = null;
const findUserByEmail = function(email) {
  for (const userID in users) {
    const user = users[userID];
    if (user.email === email) {
      foundUser = user;
    }
  }
  if (foundUser) {
    return true;
  }
};

// let urlDatabase = {
//   'b2xVn2': 'http://www.lighthouselabs.ca',
//   '9sm5xK': 'http://www.google.com'
// };

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

const users = {
  N12m34: {
    id: "N12m34",
    email: "user@a.ca",
    password: "1111",
  },
  Ab34c2: {
    id: "Ab34c2",
    email: "user@b.ca",
    password: "2222",
  },
};

app.get('/urls', (req, res) => {
  if (!foundUser) {
    return res.status(401).send('Please log in or register');
  }

  const urls = urlsForUser(foundUser.id);
  const templateVars = {
    urls: urls,
    user: users[req.cookies["user_id"]]
  };
  res.render('urls_index', templateVars);

});

app.get('/urls/new', (req, res) => {

  if (!foundUser) {
    res.redirect('/login');
  }

  const templateVars = {
    urls: newUrlDatabase,
    user: users[req.cookies["user_id"]]
  };
  res.render('urls_new', templateVars);
});

app.get('/register', (req, res) => {
  if (foundUser) {
    res.redirect('/urls');
  }
  const templateVars = {
    urls: newUrlDatabase,
    user: users[req.cookies["user_id"]],
  };
  res.render('register', templateVars);

});

app.get('/login', (req, res) => {
  if (foundUser) {
    res.redirect('/urls');
  }
  const templateVars = {
    urls: newUrlDatabase,
    user: users[req.cookies["user_id"]],
  };
  res.render('login', templateVars);
});

app.get('/urls/:id', (req, res) => {
  if (!foundUser) {
    return res.status(401).send('Please log in');
  }

  const urls = urlsForUser(foundUser.id);
  // console.log(urls);
  if (urls === undefined) {
    // console.log('unauthorized');
    return res.status(401).send('Unauthorized');
  }


  const templateVars = {
    id: req.params.id,
    longURL: newUrlDatabase[req.params.id].longURL,
    user: users[req.cookies["user_id"]]
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
  foundUser = null;
  res.clearCookie('user_id');
  res.redirect('/login');
});

app.post('/urls', (req, res) => {
  if (!foundUser) {
    return res.status(401).send('Please log in to shorten URLs\n');
  }
  let newUrlId = generateRandomString();
  newUrlDatabase = Object.assign(newUrlDatabase, {
    [newUrlId]: {
      longURL: req.body.longURL,
      userID: foundUser.id
    }
  });
  res.redirect(`/urls/${newUrlId}`);
});

app.post('/urls/:id/delete', (req, res) => {

  const urlID = newUrlDatabase[req.params.id];
  if (!urlID) {
    return res.status(404).send('ID not found\n');
  }

  if (!foundUser) {
    return res.status(401).send('Please log in or register\n');
  }

  const urls = urlsForUser(foundUser.id);
  if (urls === undefined) {
    return res.status(401).send('Unauthorized\n');
  }

  delete newUrlDatabase[req.params.id];
  res.redirect('/urls');
});

app.post('/urls/:id', (req, res) => {

  // id does not exist
  const urlID = newUrlDatabase[req.params.id];
  if (!urlID) {
    return res.status(404).send('ID not found\n');
  }

  // user not logged in
  if (!foundUser) {
    return res.status(401).send('Please log in or register\n');
  }

  // user logged in but do not own the URL
  const urls = urlsForUser(foundUser.id);
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

  if (!findUserByEmail(email)) {
    return res.status(403).send('The email address is not registered');
  }
  if (foundUser.password !== password) {
    return res.status(403).send('Wrong password');
  }

  res.cookie('user_id', foundUser.id);
  res.redirect('/urls');
});

app.post('/register', (req, res) => {
  // add email, password, id to users object
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send('Please enter email address/password');
  }

  if (findUserByEmail(email)) {
    return res.status(400).send('The email address has been registered');
  }

  const newUser = {
    id: id,
    email: email,
    password: password
  };

  users[id] = newUser;
  console.log(users);
  foundUser = newUser;
  res.cookie('user_id', id);
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