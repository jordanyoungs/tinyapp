const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser')

app.use(cookieParser());

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

//so that I never get variable does not exist errors from my templates
const templateVars = {
  user: undefined,
  error: undefined
};

const users = {
  "xk23": {
    id: "xk23",
    email: "jordan@example.com",
    password: "purple"
  },
 "ho8u": {
    id: "ho8u",
    email: "kelly@example.com",
    password: "funk"
  }
}

// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };

const urlDatabase = {
  "b2xVn2": {
    shortURL: "b2xVn2",
    longURL: "http://www.lighthouselabs.ca",
    ownerID: "xk23"
  },
  "123wer": {
    shortURL: "123wer",
    longURL: "http://www.youtube.ca",
    ownerID: "xk23"
  },
  "9sm5xK": {
   shortURL: "9sm5xK",
   longURL: "http://www.google.com",
   ownerID: "ho8u"
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
  res.end("Hello!");
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  templateVars.urls = urlDatabase;
  templateVars.user = users[req.cookies["user_id"]];
  res.render("urls-index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (req.cookies["user_id"]) {
    templateVars.user = users[req.cookies["user_id"]];
    res.render("urls-new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:id", (req, res) => {
  templateVars.shortURL = req.params.id
  templateVars.longURL = urlDatabase[req.params.id].longURL
  templateVars.user = users[req.cookies["user_id"]]
  res.render("urls-show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  if (req.cookies["user_id"] === urlDatabase[req.params.id].ownerID) {
    urlDatabase[req.params.id].longURL = req.body.longURL;

    templateVars.shortURL = req.params.id
    templateVars.longURL = urlDatabase[req.params.id].longURL
    templateVars.user = users[req.cookies["user_id"]]

    res.render("urls-show", templateVars);
  } else {
    res.status(403).send("Error! Links can only be edited by the user that created them");
  }
});

app.post("/urls", (req, res) => {
  let url_ID = generateRandomString();
  console.log("urls before:", urlDatabase)
  urlDatabase[url_ID] = {
    shortURL: url_ID,
    longURL: req.body.longURL,
    ownerID: req.cookies["user_id"]
  };
  console.log("urls after:", urlDatabase)
  res.redirect("/urls/" + url_ID);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  if (req.cookies["user_id"] === urlDatabase[req.params.id].ownerID) {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  } else {
    res.status(403).send("Error! Links can only be deleted by the user that created them");
  }
});

app.get("/login", (req, res) => {
  templateVars.user = users[req.cookies["user_id"]];
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
    res.status(403).send("Error! Email not registered");
  }
  else if (req.body.password !== users[user_id].password) {
    res.status(403).send("Error! Invalid password");
  }
  else {
    res.cookie("user_id", user_id);
    res.redirect("/");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  templateVars.user = users[req.cookies["user_id"]];
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
    res.render("register", templateVars)
    //res.status(400).send("Error! Email cannot be empty");
  }
  else if (req.body.password === "") {
    res.status(400).send("Error! Password cannot be empty");
  }
  else if (emailExists) {
    res.status(400).send("Error! Email already registered");
  }
  else {
    const newID = generateRandomString();

    users[newID] = {
      id: newID,
      email: req.body.email,
      password: req.body.password
    };

    res.cookie("user_id", newID);
    res.redirect("/urls");
  }
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});