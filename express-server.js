const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require('cookie-session')
const bcrypt = require('bcryptjs');

app.use(cookieSession({
  name: 'session',
  keys: ['secretkey1', 'secretkey2'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

//so that I never get variable does not exist errors from my templates
const templateVars = {
  user: undefined,
  error: undefined
};
//but i want them to be reset before every request so I will use middleware
app.use(function(req, res, next) {
  templateVars.user = users[req.session.user_id];
  templateVars.error = undefined;
  next();
});

const users = {
  "11xk23": {
    id: "11xk23",
    email: "jordan@example.com",
    password: bcrypt.hashSync("purple", 10)
  },
 "11ho8u": {
    id: "11ho8u",
    email: "kelly@example.com",
    password: bcrypt.hashSync("funk", 10)
  }
}

const urlDatabase = {
  "b2xVn2": {
    shortURL: "b2xVn2",
    longURL: "http://www.lighthouselabs.ca",
    ownerID: "11xk23"
  },
  "123wer": {
    shortURL: "123wer",
    longURL: "http://www.youtube.ca",
    ownerID: "11xk23"
  },
  "9sm5xK": {
   shortURL: "9sm5xK",
   longURL: "http://www.google.com",
   ownerID: "11ho8u"
  }
};

function generateRandomString() {
  const characters = [];
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz012456789";

  for (let i = 0; i < 6; i++) {
    randomChar = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    characters.push(randomChar);
  }

  return characters.join("");
}

function getOwnedUrls(userID) {
  const ownedUrls = {};

  for (let url in urlDatabase) {
    if (urlDatabase[url].ownerID === userID) {
      ownedUrls[url] = urlDatabase[url];
    }
  }

  return ownedUrls;
}

app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  if (req.session.user_id) {
    templateVars.urls = getOwnedUrls(req.session.user_id);
  } else {
    templateVars.urls = {};
    templateVars.error = "401 Error: Please login or register to view URLs"
  }
  res.render("urls-index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    res.render("urls-new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    templateVars.error = "404 Error: URL does not exist";
  } else if (req.session.user_id && (req.session.user_id === urlDatabase[req.params.id].ownerID)) {
    templateVars.shortURL = req.params.id;
    templateVars.longURL = urlDatabase[req.params.id].longURL;
  } else if (req.session.user_id) {
    templateVars.error = "403 Error: Users can only edit links they created";
  } else {
    templateVars.error = "401 Error: You must be logged in to edit a URL"
  }
  res.render("urls-show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.id].ownerID) {
    urlDatabase[req.params.id].longURL = req.body.longURL;

    templateVars.shortURL = req.params.id
    templateVars.longURL = urlDatabase[req.params.id].longURL

    res.render("urls-show", templateVars);
  } else {
    templateVars.error = "403 Error: Links can only be edited by the user that created them";
    res.render("urls-show", templateVars);
  }
});

app.post("/urls", (req, res) => {
  let url_ID = generateRandomString();

  urlDatabase[url_ID] = {
    shortURL: url_ID,
    longURL: req.body.longURL,
    ownerID: req.session.user_id
  };

  res.redirect("/urls/" + url_ID);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.id].ownerID) {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  } else {
    templateVars.error = "403 Error: Links can only be deleted by the user that created them";
    res.render("urls-index", templateVars);
  }
});

app.get("/login", (req, res) => {
  res.render("login", templateVars);
})

app.post("/login", (req, res) => {
  let emailExists = false;
  let user_id;

  for (let id in users) {
    if (users[id].email === req.body.email) {
      emailExists = true;
      user_id = id;
    }
  }

  if (!emailExists) {
    templateVars.error = "403 Error: Email not registered";
    res.render("login", templateVars);
  }
  else if (!bcrypt.compareSync(req.body.password, users[user_id].password)) {
    templateVars.error = "403 Error: Invalid password";
    res.render("login", templateVars);
  }
  else {
    req.session.user_id = user_id;
    res.redirect("/");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("session");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  res.render("register", templateVars);
})

app.post("/register", (req, res) => {
  let emailExists = false;

  for (let id in users) {
    if (users[id].email === req.body.email) {
      emailExists = true;
    }
  }

  if (req.body.email === "") {
    templateVars.error = "400 Error: Email cannot be empty";
    res.render("register", templateVars);
  }
  else if (req.body.password === "") {
    templateVars.error = "400 Error: Password cannot be empty";
    res.render("register", templateVars);
  }
  else if (emailExists) {
    templateVars.error = "400 Error: Email already registered";
    res.render("register", templateVars);
  }
  else {
    const newID = generateRandomString();
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);

    users[newID] = {
      id: newID,
      email: req.body.email,
      password: hashedPassword
    };

    req.session.user_id = newID;
    res.redirect("/urls");
  }
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});