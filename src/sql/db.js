const mysql = require("mysql");
require("dotenv").config();

// defined connection
let connection = mysql.createConnection({
  // connectionLimit: 100,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
});

connection.query("select now()", (err, rows) => {
  if (err) {
    console.log("connection not successful", err);
  } else {
    console.log("connection successful", rows);
  }
});

connection.queryPromise = (sql, params) => {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

connection.querySync = async (sql, params) => {
  let promise = new Promise((resolve, reject) => {
    console.log(`executing query, ${sql}`);
    connection.query(sql, params, (err, results) => {
      if (err) {
        console.log(`rejecting`);
        return reject(err);
      } else {
        console.log(`resolving`);
        return resolve(results);
      }
    });
  });
  let results = await promise
    .then((results) => {
      console.log(`results, ${results}`);
      return results;
    })
    .catch((err) => {
      throw err;
    });
  return results;
};

// make connection

module.exports = connection;

// make a note: previous project that had a public folder?
