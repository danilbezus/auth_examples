const axios = require("axios").default;

const AUTH0_URL = "https://dev-xxaf0urwyh5kyms6.us.auth0.com/";
const CLIENT_ID = "6TvNz8N65Op5hKCQWGdO0L8ysRG04hGN";
const CLIENT_SECRET =
  "wpw-fSzhL8k_borUQEe7Ewv3LmVWL_CCzW52191BZAwU3T0c093JyTwC7vzTIEuZ";
const AUDIENCE = 'https://test-api/';

const getTokens = async (email, password) => {
  const authResponse = await axios.post(AUTH0_URL + "oauth/token", {
    grant_type: "password",
    username: email,
    password: password,
    audience: AUDIENCE,
    scope: "offline_access", 
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  if (authResponse.status !== 200) {
    return null;
  }

  return {
    access_token: authResponse.data.access_token,
    refresh_token: authResponse.data.refresh_token,
  };
};

const refreshAccessToken = async (refreshToken) => {
  const authResponse = await axios.post(AUTH0_URL + "oauth/token", {
    grant_type: "refresh_token",
    refreshToken,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  if (authResponse.status !== 200) {
    return null;
  }

  return {
    access_token: authResponse.data.access_token,
    refresh_token: authResponse.data.refresh_token,
  };
};

const getManagementToken = async () => {
  try {
    const authResponse = await axios.post(AUTH0_URL + "oauth/token", {
      grant_type: "client_credentials",
      audience: "https://dev-0c5i5w01fsm38lot.us.auth0.com/api/v2/",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    });

    if (authResponse.status !== 200) {
      return null;
    }

    return authResponse.data.access_token;
  } catch (error) {
    console.log(error);
    return null;
  }
};

const getJwks = async () => {
  const authResponse = await axios.get(AUTH0_URL + ".well-known/jwks.json");
  if (authResponse.status !== 200) {
    return null;
  }

  return authResponse.data.keys[0];
};

const createUser = async (email, password) => {
  try {
    const managementToken = await getManagementToken();
    const authResponse = await axios.post(
      "https://dev-0c5i5w01fsm38lot.us.auth0.com/api/v2/users",
      {
        email,
        password,
        connection: "Username-Password-Authentication",
      },
      {
        headers: {
          Authorization: `Bearer ${managementToken}`,
        },
      }
    );

    if (authResponse.status !== 200) {
      return null;
    }
  } catch (error) {
    console.log(error);
    return null;
  }
};

const getLoginRedirectUri = () => {
  const localRedirectUri = encodeURIComponent(
    "http://localhost:3000/oidc-callback"
  );

  return `${AUTH0_URL}authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${localRedirectUri}&scope=offline_access&audience=${AUDIENCE}`;
};

const getTokensFromCode = async (code) => {
  try {
    const data = {
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code: code,
      audience: AUDIENCE,
      redirect_uri: "http://localhost:3000",
    };

    const authResponse = await axios.post(AUTH0_URL + "oauth/token", data, {
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });

    if (authResponse.status !== 200) {
      return null;
    }

    return {
      access_token: authResponse.data.access_token,
      refresh_token: authResponse.data.refresh_token,
    };
  } catch (error) {
    console.log(error);
    return null;
  }
};

module.exports = {
  createUser,
  getTokens,
  refreshAccessToken,
  getJwks,
  getLoginRedirectUri,
  getTokensFromCode,
};
