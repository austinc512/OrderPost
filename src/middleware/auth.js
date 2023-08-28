const jwt = require("jsonwebtoken");
require("dotenv").config();

// next is a built in function that let's you chain actions
let checkJWT = (req, res, next) => {
  //
  let headerValue = req.get("Authorization");
  let signedToken;
  if (headerValue) {
    // console.log(`header value: ${headerValue}`);
    let parts = headerValue.split(" ");
    // console.log(`parts: ${parts}`);
    signedToken = parts[1];
  }
  if (!signedToken) {
    // you done messed up
    // console.log(`Missing signed token`);
    // console.log(`token: ${signedToken}`);
    res.sendStatus(401);
    return;
  }

  // if I get here, the signed token is good
  // so I want to verify the secret

  try {
    // console.log(`in try block`);
    let unsigned = jwt.verify(signedToken, process.env.JWT_SECRET);
    req.userInfo = unsigned;
  } catch (err) {
    console.log("failed to verify the token, ", err);
    res.sendStatus(403);
    return;
  }
  // if we're here, it's a valid token, so we go to the next task in the chain
  next();
};

// this whole file is basically a middleware controller
module.exports = { checkJWT };
