const crypto = require("node:crypto");

const base64urlEncode = (str) =>
  Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const newJwt = (userId, username) => {
  const alg = "HS256";
  const typ = "JWT";

  const header = {
    alg: alg,
    typ: typ,
  };

  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 900;

  const payload = {
    sub: userId,
    name: username,
    iat: iat,
    exp: exp,
  };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const secretKey = 'SECRET';
  const signature = base64urlEncode(
    crypto
      .createHmac("sha256", secretKey)
      .update(encodedHeader + "." + encodedPayload)
      .digest("binary")
  );

  const jwt = `${encodedHeader}.${encodedPayload}.${signature}`;
  return jwt;
};

module.exports = {
  newJwt,
};
