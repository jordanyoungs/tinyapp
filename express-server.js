const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser')

app.use(cookieParser());

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

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

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  let templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]]
    };
  res.render("urls-index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (req.cookies["user_id"]) {
    let templateVars = {user: users[req.cookies["user_id"]]};
    res.render("urls-new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users[req.cookies["user_id"]]
    };
  res.render("urls-show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users[req.cookies["user_id"]]
    };
  res.render("urls-show", templateVars);
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect("/urls/" + shortURL);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  let templateVars = {user: users[req.cookies["user_id"]]};
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
  let templateVars = {user: users[req.cookies["user_id"]]};
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
    res.status(400).send("Error! Email cannot be empty");
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