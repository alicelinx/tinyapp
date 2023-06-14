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
  let newId = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i <= 5; i++) {
    newId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return newId;
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

let urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
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
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]]
  };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]]

  };
  res.render('urls_new', templateVars);
});

app.get('/register', (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]],
  };
  res.render('register', templateVars);

});

app.get('/login', (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]],
  };
  res.render('login', templateVars);
});

app.get('/urls/:id', (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users[req.cookies["user_id"]]
  };
  res.render('urls_show', templateVars);
});

app.get('/u/:id', (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.post('/urls', (req, res) => {
  let newUrlId = generateRandomString();
  urlDatabase = Object.assign(urlDatabase, { [newUrlId]: req.body.longURL });
  res.redirect(`/urls/${newUrlId}`);
});

app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

app.post('/urls/:id/update', (req, res) => {
  urlDatabase[req.params.id] = req.body.newUrl;
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