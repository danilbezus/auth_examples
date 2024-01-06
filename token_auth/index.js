const uuid = require("uuid");
const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("./jwt");
const auth0 = require("./auth0");
const path = require("path");
const port = 3000;

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested With, Content-Type, Accept"
  );
  next();
});

const AUTHORIZATION_HEADER = "authorization";

const asyncHandler = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};

const login = async (req, res) => {
  const { login, password } = req.body;

  const tokens = await auth0.getTokens(login, password);

  if (tokens) {
    res.cookie("refresh_token", tokens.refresh_token, {
      httpOnly: true,
      secure: false,
    });
    res.status(200).json({ token: tokens.access_token }).send();
  } else {
    res.status(401).send();
  }
};

const refreshTokenIfNeeded = async (req, expires) => {
  const dif = (expires - new Date()) / 1000 / 60;
  if (dif > 5) {
    return;
  }

  const tokens = auth0.refreshAccessToken(req.cookies.refresh_token);
  res.cookie("refresh_token", tokens.refresh_token, {
    httpOnly: true,
    secure: false,
  });
  res.json({ token: tokens.access_token });
};

app.use(
  asyncHandler(async (req, res, next) => {
    const token = req.headers[AUTHORIZATION_HEADER];
    if (token?.length) {
      const tokenData = await jwt.validateJwt(token);
      req.session = tokenData.principal;
      await refreshTokenIfNeeded(req, tokenData.expires);
    }

    next();
  })
);

app.get("/", (req, res) => {
  if (req.session?.username) {
    return res.json({
      username: req.session.username,
      logout: "http://localhost:3000/logout",
    });
  }

  res.sendFile(path.join(__dirname + "/index.html"));
});

app.get("/logout", (req, res) => {
  sessions.destroy(req, res);
  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: false,
    domain: "localhost",
    path: "/",
  });
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: false,
    domain: "localhost",
    path: "/",
  });
  res.status(204).send();
});

app.post("/api/login", async (req, res) => {
  const redirectUrl = auth0.getLoginRedirectUri();
  res.json({ redirectUrl });
});

app.get("/oidc-callback", async (req, res) => {
  const tokens = await auth0.getTokensFromCode(req.query.code);

  if (tokens) {
    res.cookie("refresh_token", tokens.refresh_token, {
      httpOnly: true,
      secure: false,
    });
    res.cookie("access_token", tokens.access_token, {
      httpOnly: false,
      secure: false,
    });

    res.redirect("/");
  } else {
    res.status(401).send();
  }
});

app.post("/api/register", async (req, res) => {
  await auth0.createUser(req.body.login, req.body.password);
  return await login(req, res);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
