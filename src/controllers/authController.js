const db = require("../sql/db");
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");
require("dotenv").config();

/*
get the username, password, full_name from request body
hash the password first
then insert the new record into DB

since the hash MUST finish first,
we have to do an async/await to these steps

request:

{
    "username": "string",
    "password": "string",
    "first_name": "string"
    "last_name": "string"
    "email": "string@gmail.com"
}
*/

let registerUser = async (req, res) => {
  const { username, password, first_name, last_name, email } = req.body;

  let password_hash;
  try {
    password_hash = await argon2.hash(password);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
    return;
  }

  let sql =
    "INSERT INTO OrderPost_users (username, password_hash, first_name, last_name, email) values (?, ?, ?, ?, ?)";

  let params = [username, password_hash, first_name, last_name, email];

  try {
    let results = await db.queryPromise(sql, params);
    // since I don't need to see any results, I don't need to use querySync
    res.sendStatus(204);
  } catch (err) {
    console.log(err);
    if (err.code == "ER_DUP_ENTRY") {
      res.status(400).json("username or email is not available.");
    } else {
      res.sendStatus(500);
    }
    return;
  }
};

/*
{
    "username": "string",
    "password": "string"
}
*/

const login = async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  let sql =
    "select user_id, first_name, last_name, password_hash from OrderPost_users where username = ?";
  let params = [username];

  db.query(sql, params, async (err, rows) => {
    // could clean this up into a querySync later
    // I'm kinda doing a callback hell here.
    if (err) {
      console.log("Could not find username, ", err);
      res.sendStatus(500);
    } else {
      // we found someone, make sure it's just 1 row
      if (rows.length > 1) {
        // we have a real fucking problem on our hands
        console.log(`returned too many rows for username: ${username}`);
        res.sendStatus(500);
      } else if (rows.length == 0) {
        console.log(`not a valid username, ${username}`);
        // could just be username that's incorrect
        res.sendStatus(400).json({ error: `invalid username` });
      } else {
        // we have 1 good row
        // it comes back as an arr of an object, so we need rows[0]
        const pwHash = rows[0].password_hash;
        const first_name = rows[0].first_name;
        const last_name = rows[0].last_name;
        const user_id = rows[0].user_id;

        let goodPass = false;

        try {
          goodPass = await argon2.verify(pwHash, password); //returns bool
          // if it's good here, goodPass = true
        } catch (err) {
          console.log(`failed to verify password, ${err}`);
          res.status(400).send("invalid password");
        }

        if (goodPass) {
          // send JWT
          let token = {
            firstName: first_name,
            lastName: last_name,
            userId: user_id,
          };
          //   res.status(200).send(token);
          // JK, now we need to sign the token
          // JWT_SECRET
          const signedToken = jwt.sign(token, process.env.JWT_SECRET);
          // testing
          res.json(signedToken);
          // res.sendStatus(200);
          // in a real project, you send this token to the frontend.
          // and the frontend will store it in session storage, local storage, or a cookie
        }
      }
    }
  });

  // needs to be async function when I turn this on
  //   let password_hash;
  //   try {
  //     password_hash = await argon2.hash(password);
  //   } catch (err) {
  //     console.log(err);
  //     res.sendStatus(500);
  //     return;
  //   }
};

module.exports = {
  registerUser,
  login,
};
