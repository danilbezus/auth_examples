const auth0 = require("./auth0");
const jwkToPem = require("jwk-to-pem");
const jsonwebtoken = require("jsonwebtoken");


const validateJwt = async (token) => {
  const jwks = await auth0.getJwks();
  const validationResult = jsonwebtoken.verify(token, jwkToPem(jwks));

  return {
    principal: {
      username: validationResult.sub,
    },
    expires: new Date(Number(validationResult.exp) * 1000),
  };
};

module.exports = {
  validateJwt,
};
