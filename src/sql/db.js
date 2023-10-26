// OLD VERSION

// const mysql = require("mysql");
// require("dotenv").config();

// // defined connection
// let connection = mysql.createConnection({
//   // connectionLimit: 100,
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_DATABASE,
//   port: process.env.DB_PORT,
// });

// connection.query("select now()", (err, rows) => {
//   if (err) {
//     console.log("connection not successful", err);
//   } else {
//     console.log("connection successful", rows);
//   }
// });

// connection.queryPromise = (sql, params) => {
//   return new Promise((resolve, reject) => {
//     connection.query(sql, params, (err, rows) => {
//       if (err) {
//         reject(err);
//       } else {
//         resolve(rows);
//       }
//     });
//   });
// };

// connection.querySync = async (sql, params) => {
//   let promise = new Promise((resolve, reject) => {
//     console.log(`executing query, ${sql}`);
//     connection.query(sql, params, (err, results) => {
//       if (err) {
//         // console.log(`rejecting`);
//         return reject(err);
//       } else {
//         // console.log(`resolving`);
//         return resolve(results);
//       }
//     });
//   });
//   let results = await promise
//     .then((results) => {
//       // console.log(`results, ${results}`);
//       return results;
//     })
//     .catch((err) => {
//       console.log(`db.js catch block err:`);
//       console.log(err);
//     });
//   return results;
// };

// // make connection

// module.exports = connection;

// NEW VERSION
const mysql = require("mysql");
require("dotenv").config();

// Create a connection pool
const pool = mysql.createPool({
  connectionLimit: 100,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
});

pool.query("SELECT NOW()", (err, rows) => {
  if (err) {
    console.log("Initial pool connection not successful", err);
  } else {
    console.log("Initial pool connection successful", rows);
  }
});

// Promise-based query function using the pool
pool.queryPromise = (sql, params) => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        console.log(`queryPromise REJECT`);
        reject(err);
        return;
      }

      // else {
      //   console.log(`logging connection`);
      //   console.log(connection);
      // }

      connection.query(sql, params, (error, results) => {
        connection.release(); // Release the connection back to the pool

        if (error) {
          console.log(`connection.query REJECT`);
          console.log(error);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  });
};

// Async/Await based query function using the pool
pool.querySync = async (sql, params) => {
  try {
    console.log(`Executing query: ${sql}`);
    const results = await pool.queryPromise(sql, params);
    return results;
  } catch (err) {
    console.log("db.js catch block err:");
    console.log(err);
    throw err;
  }
};

module.exports = pool;
