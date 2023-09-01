const db = require("../sql/db");

// how do I get current userId from the requester?

const listCustomers = (req, res) => {
  const userId = req.userInfo.userId;
  let sql = `SELECT * FROM OrderPost_customers WHERE user_id = ${userId} LIMIT 100`;
  // I still need to implement sizing
  if (req.query.size) {
    console.log(`size is being sent`);
    const size = +req.query.size;
    if (Number.isFinite(size)) {
      console.log(`size is a number`);
      if (size > 500) {
        res.status(400).json(`size param is too big`);
        return;
      } else if (size < 1) {
        res.status(400).json(`size param is too small`);
        return;
      }
      sql = `SELECT * FROM OrderPost_customers WHERE user_id = ${userId} LIMIT ${size}`;
    } else {
      console.log(`size is sent, but size cannot be coerced into a number`);
      res.status(400).json(`size param looks incorrect`);
      return;
    }
  }
  db.query(sql, (err, rows) => {
    if (err) {
      console.log(`${sql} failed:`);
      console.log(err);
      res.status(500).json(err);
      return;
    } else {
      console.log(`${sql} returned results:`);
      console.log(rows);
      res.json(rows);
      return;
    }
  });
  // I still need to implement sizing
};

const getCustomerById = (req, res) => {
  const customerId = [req.params.customerId];
  let sql = "SELECT * FROM OrderPost_customers WHERE customer_id = ?";
  db.query(sql, customerId, (err, rows) => {
    if (err) {
      console.log(`SELECT from OrderPost_customers by ID failed:`);
      console.log(err);
    } else {
      if (rows.length === 0) {
        console.log(`SELECT from OrderPost_customers by ID returned 0 results`);
        res.status(400).json(`There are no customers with this ID`);
        return;
      } else {
        console.log("SELECT from OrderPost_customers by ID returned results: ");
        console.log(rows);
        res.json(rows[0]);
      }
    }
  });
};

const createCustomer = (req, res) => {
  /*
  {
    "first_name": "Austin",
    "last_name": "Covey",
    "phone": "512-555-4444",
    "email": "austincovey.dev@gmail.com"
}
  */

  const { first_name, last_name, phone, email } = req.body;
  if (!req.body || !first_name || !last_name || !phone || !email) {
    console.log("A falsy value was sent in createCustomer request body");
    res
      .status(400)
      .json("A required property in the request has a falsy value");
    return;
  }
  if (
    typeof first_name != "string" ||
    typeof last_name != "string" ||
    typeof phone != "string" ||
    typeof email != "string"
  ) {
    console.log(
      "1 or more properties in the createCustomer request body are not of type string"
    );
    res.status(400).json("1 or more properties are not of type string");
    return;
  }
  // if we get here, we have all properties, and they are strings.
  let sql =
    "INSERT into OrderPost_customers (first_name, last_name, phone, email) VALUES (?, ?, ?, ?)";

  let params = [first_name, last_name, phone, email];

  db.query(sql, params, (err, dbResponse) => {
    if (err) {
      console.log(`insert into OrderPost_customers failed:`);
      console.log(err);
      console.log(err.code);
      // I'm not enforcing uniqueness on anything in this table right now (other than auto ID)
      // that could change later, so I'm still using this pattern
      if (err.code == "ER_DUP_ENTRY") {
        res.status(400).json(`not a unique customer`);
        return;
      } else {
        res.status(500).json(`something failed`);
        return;
      }
    } else {
      console.log(`insert into OrderPost_customers succeeded:`);
      console.log(dbResponse);
      return res.json(dbResponse);
    }
  });
};

const updateCustomer = (req, res) => {
  const customerId = [req.params.customerId];
  console.log(customerId);
  let requestPropertyCounter = 0;
  const keys = Object.keys(req.body);
  console.log(keys);
  for (let item of keys) {
    if (
      item === "first_name" ||
      item === "last_name" ||
      item === "phone" ||
      item === "email"
    ) {
      requestPropertyCounter++;
    }
  }
  if (requestPropertyCounter == 0) {
    console.log("updateCustomer request body contained no valid properties");
    res
      .status(400)
      .json(`request body contained no valid properties to update`);
    return;
  }
  // if here, then request body contains something to update.
  // is there some iterative way I can update the sql statement from the properties?
  const { first_name, last_name, phone, email } = req.body;
  console.log(first_name);
  res.json("still testing brb");
};

const deleteCustomer = (req, res) => {
  // creating scaffolding
  // will implement later
  res.json(`Coming Soon!`);
};

// ship-to address functions

const getCustomerAddresses = (req, res) => {
  // creating scaffolding
  // will implement later
  res.json(`Coming Soon!`);
};

const createCustomerAddress = (req, res) => {
  // creating scaffolding
  // will implement later
  res.json(`Coming Soon!`);
};

const getAddressById = (req, res) => {
  // creating scaffolding
  // will implement later
  res.json(`Coming Soon!`);
};

const updateAddressById = (req, res) => {
  // creating scaffolding
  // will implement later
  res.json(`Coming Soon!`);
};

const deleteAddressById = (req, res) => {
  // creating scaffolding
  // will implement later
  res.json(`Coming Soon!`);
};

module.exports = {
  listCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerAddresses,
  createCustomerAddress,
  getAddressById,
  updateAddressById,
  deleteAddressById,
};
