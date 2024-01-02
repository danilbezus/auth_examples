const axios = require('axios');

const AUTH0_DOMAIN = 'dev-xxaf0urwyh5kyms6.us.auth0.com';
const AUTH0_CLIENT_ID = '6TvNz8N65Op5hKCQWGdO0L8ysRG04hGN';
const AUTH0_CLIENT_SECRET = 'wpw-fSzhL8k_borUQEe7Ewv3LmVWL_CCzW52191BZAwU3T0c093JyTwC7vzTIEuZ';
const AUTH0_AUDIENCE = 'https://dev-xxaf0urwyh5kyms6.us.auth0.com/api/v2/';

const auth0RefreshToken = async (refreshToken) => {
  const response = await axios.post('https://' + AUTH0_DOMAIN + "/oauth/token", {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: AUTH0_CLIENT_ID,
    client_secret: AUTH0_CLIENT_SECRET,
  });

  return response.data;
}

const getAccessToken = async () => {
  const response = await axios.post('https://' + AUTH0_DOMAIN + '/oauth/token', {
    grant_type: 'client_credentials',
    audience: AUTH0_AUDIENCE,
    client_id: AUTH0_CLIENT_ID,
    client_secret: AUTH0_CLIENT_SECRET,
  });
  if (response.status !== 200) {
    return null;
  }
  return response.data;
}

const auth0Login = async (username, password) => {
  const response = await axios.post('https://' + AUTH0_DOMAIN + '/oauth/token', {
    grant_type: 'password',
    username: username,
    password: password,
    audience: AUTH0_AUDIENCE,
    scope: 'offline_access',
    client_id: AUTH0_CLIENT_ID,
    client_secret: AUTH0_CLIENT_SECRET,
  });
  console.log(response);
  return response.data;
}


const auth0Register = async (username, password) => {
  const accessTokenRes = await getAccessToken();
  const accessToken = accessTokenRes.access_token;
  const response = await axios.post('https://' + AUTH0_DOMAIN + '/api/v2/users',
    {
      email: username,
      password,
      connection: "Username-Password-Authentication",
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  console.log(response);
  return response;
}


module.exports = { auth0Login, auth0Register, auth0RefreshToken }