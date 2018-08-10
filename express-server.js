const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const cookieSession = require('cookie-session')
const bcrypt = require('bcryptjs');
const bodyParser = require("body-parser");
app.set("view engine", "ejs");



//--------------------MIDDLEWARE--------------------//

app.use(cookieSession({
  name: 'session',
  keys: ['secretkey1', 'secretkey2'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.use(bodyParser.urlencoded({extended: true}));



//--------------------MY MIDDLEWARE--------------------//
/* I set up this middleware so that user and error will always exist but just be set to undefined.
The middleware updates user everytime, as well as checks the cookie and updates the isLoggedin variable.
It also clears error so that I can pass an error message once and know it will be cleared after.*/

const templateVars = {
  user: undefined,
  error: undefined
};

let isLoggedIn;

app.use(function(req, res, next) {
  templateVars.user = users[req.session.user_id];
  templateVars.error = undefined;
  isLoggedIn = req.session.user_id;
  next();
});



//--------------------DATABASES--------------------//

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



//--------------------HELPER FUNCTIONS--------------------//

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



//--------------------*ROUTES*--------------------//

//--------------------ROOT--------------------//

app.get("/", (req, res) => {
  if (isLoggedIn) {
    res.redirect("/urls");

  } else {
    res.redirect("/login");
  }
});



//--------------------REGISTER--------------------//

app.get("/register", (req, res) => {
  if (isLoggedIn) {
    res.redirect("/urls");

  } else {
    res.render("register", templateVars);
  }
})


app.post("/register", (req, res) => {
  let emailExists = false;

  for (let id in users) {
    if (users[id].email === req.body.email) {
      emailExists = true;
    }
  }

  //empty email
  if (req.body.email === "") {
    templateVars.error = "400 Error: Email cannot be empty";
    res.render("register", templateVars);

  //empty password
  } else if (req.body.password === "") {
    templateVars.error = "400 Error: Password cannot be empty";
    res.render("register", templateVars);

  //email already in use
  } else if (emailExists) {
    templateVars.error = "400 Error: Email already registered";
    res.render("register", templateVars);

  //everything ok
  } else {
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



//--------------------LOGIN--------------------//

app.get("/login", (req, res) => {
  if (isLoggedIn) {
    res.redirect("/urls");

  } else {
    res.render("login", templateVars);
  }
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

  } else if (!bcrypt.compareSync(req.body.password, users[user_id].password)) {
    templateVars.error = "403 Error: Invalid password";
    res.render("login", templateVars);

  } else {
    req.session.user_id = user_id;
    res.redirect("/");
  }
});



//--------------------LOGOUT--------------------//

app.post("/logout", (req, res) => {
  res.clearCookie("session");
  res.redirect("/urls");
});



//--------------------URLS--------------------//

app.get("/urls", (req, res) => {
  if (isLoggedIn) {
    templateVars.urls = getOwnedUrls(req.session.user_id);

  } else {
    templateVars.urls = {};
    templateVars.error = "401 Error: Please login or register to view URLs"
  }

  res.render("urls-index", templateVars);
});


app.post("/urls", (req, res) => {
  if (isLoggedIn) {
    let url_ID = generateRandomString();

    urlDatabase[url_ID] = {
      shortURL: url_ID,
      longURL: req.body.longURL,
      ownerID: req.session.user_id
    };

    res.redirect("/urls/" + url_ID);

  } else {
    templateVars.error = "401 Error: You must be logged in to create a new URL";
    res.render("login", templateVars);
  }
});



//--------------------URLS/NEW--------------------//

app.get("/urls/new", (req, res) => {
  if (isLoggedIn) {
    res.render("urls-new", templateVars);

  } else {
    res.redirect("/login");
  }
});



//--------------------URLS/:ID--------------------//

app.get("/urls/:id", (req, res) => {
  //url not in database
  if (!urlDatabase[req.params.id]) {
    templateVars.error = "404 Error: URL does not exist in database";

  //logged in and owner of url
  } else if (isLoggedIn && (req.session.user_id === urlDatabase[req.params.id].ownerID)) {
    templateVars.shortURL = req.params.id;
    templateVars.longURL = urlDatabase[req.params.id].longURL;

  //logged in but not owner
  } else if (isLoggedIn) {
    templateVars.error = "403 Error: Users can only edit URLs they created";

  //not logged in
  } else {
    templateVars.error = "401 Error: You must be logged in to edit a URL"
  }

  res.render("urls-show", templateVars);
});


app.post("/urls/:id", (req, res) => {
  //logged in and owner of URL
  if (isLoggedIn && (req.session.user_id === urlDatabase[req.params.id].ownerID)) {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect("/urls");

  //logged in but not owner
  } else if (isLoggedIn) {
    templateVars.error = "403 Error: URLs can only be edited by the user that created them";
    res.render("urls-show", templateVars);

  //not logged in
  } else {
    templateVars.error = "401 Error: You must be logged in to edit a URL";
    res.render("login", templateVars);
  }
});



//--------------------URLS/:ID/DELETE--------------------//

app.post("/urls/:id/delete", (req, res) => {
  //logged in and owner of URL
  if (isLoggedIn && (req.session.user_id === urlDatabase[req.params.id].ownerID)) {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");

  //logged in but not owner
  } else if (isLoggedIn) {
    templateVars.error = "403 Error: URLs can only be deleted by the user that created them";
    res.render("urls-index", templateVars);

  //not logged in
  } else {
    templateVars.error = "401 Error: You must be logged in to delete a URL";
    res.render("login", templateVars);
  }
});



//--------------------U/:SHORTURL--------------------//

app.get("/u/:shortURL", (req, res) => {
  //url not in database
  if (!urlDatabase[req.params.shortURL]) {
    templateVars.error = "404 Error: URL does not exist in database";
    res.render("login", templateVars);

  //url found
  } else {
    let longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  }
});



//--------------------APP.LISTEN--------------------//

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});