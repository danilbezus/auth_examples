const jsonwebtoken = require('jsonwebtoken');
const fs = require('fs');

const getCert = () => fs.readFileSync('cert.pem');

const validateJtw = (jtwToken) => {
  const cert = getCert();
  jsonwebtoken.verify(jtwToken, cert, { algorithms: ['RS256'] }, (error, payload) => {
    if (error) throw new Error(error);
    console.log('jwt validated');
    console.log(payload);
  });
}

module.exports = { validateJtw }
