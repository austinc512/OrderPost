const db = require("../sql/db");

// how do I get current userId from the requester?

const listCustomers = (req, res) => {
  const userId = req.userInfo.userId;
  let size = 100; // default value
  let offset = 0; // default value
  let errors = [];

  /*
  later, offset can be multiplied by page number for pagination.
  */

  if (req.query.size) {
    size = +req.query.size;
    if (!Number.isFinite(size) || size > 500 || size < 1) {
      errors.push({
        status: "error",
        message:
          "Invalid 'size' parameter. It must be a number between 1 and 500.",
        code: 400,
      });
    }
  }

  if (req.query.offset) {
    offset = +req.query.offset;
    if (!Number.isFinite(offset) || offset < 0) {
      errors.push({
        status: "error",
        message: "Invalid 'offset' parameter. It must be a positive number.",
        code: 400,
      });
    }
  }

  if (errors.length) {
    return res.status(400).json({ errors });
  }
  const sql =
    "SELECT * FROM OrderPost_customers WHERE user_id = ? LIMIT ? OFFSET ?";
  db.query(sql, [userId, size, offset], (err, rows) => {
    if (err) {
      console.error("SQL query failed:", err);
      return res.status(500).json({
        status: "error",
        message: "Internal Server Error",
        code: 500,
      });
    }

    res.json({
      data: rows,
      meta: {
        size,
        offset,
      },
    });
  });
};

const getCustomerById = (req, res) => {
  let errors = [];
  const customerId = +req.params.customerId;
  const userId = req.userInfo.userId;

  if (!Number.isFinite(customerId)) {
    errors.push({
      status: "error",
      message: "Invalid 'customerId' parameter. It must be an integer.",
      code: 400,
    });
  }

  if (errors.length) {
    return res.status(400).json({ errors });
  }

  let sql =
    "SELECT * FROM OrderPost_customers WHERE customer_id = ? AND user_id = ?";
  const params = [customerId, userId];
  db.query(sql, params, (err, rows) => {
    if (err) {
      console.log(`SELECT from OrderPost_customers by ID failed:`);
      console.log(err);
      return res.status(500).json({
        errors: {
          status: "error",
          message: "Internal Server Error",
          code: 500,
        },
      });
    } else {
      if (rows.length === 0) {
        console.log(`SELECT from OrderPost_customers by ID returned 0 results`);
        res.status(404).json({
          errors: {
            status: "error",
            message: "No customer with this ID was found",
            code: 404,
          },
        });
        return;
      } else {
        console.log("SELECT from OrderPost_customers by ID returned results: ");
        console.log(rows);
        res.json({ data: rows[0] });
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

  const errors = [];
  const userId = req.userInfo.userId;

  const { first_name, last_name, phone, email } = req.body;
  if (!req.body || !first_name || !last_name || !phone || !email) {
    console.log("A falsy value was sent in createCustomer request body");
    errors.push({
      status: "error",
      message:
        "A falsy value was sent in createCustomer request body (check for missing required properties)",
      code: 400,
    });
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
    errors.push({
      status: "error",
      message: "1 or more properties are not of type string",
      code: 400,
    });
  }

  if (errors.length) {
    res.status(400).json({ errors });
    return;
  }

  // if we get here, we have all properties, and they are strings.
  let sql =
    "INSERT into OrderPost_customers (first_name, last_name, phone, email, user_id) VALUES (?, ?, ?, ?, ?)";

  let params = [first_name, last_name, phone, email, userId];

  db.query(sql, params, (err, dbResponse) => {
    if (err) {
      console.log(`insert into OrderPost_customers failed:`);
      console.log(err);
      console.log(err.code);
      // I'm not enforcing uniqueness on anything in this table right now (other than auto ID)
      // that could change later, so I'm still using this pattern
      if (err.code == "ER_DUP_ENTRY") {
        return res.status(400).json({
          errors: {
            status: "error",
            message: "Not a unique customer",
            code: 500,
          },
        });
      } else {
        return res.status(500).json({
          errors: {
            status: "error",
            message: "Internal Server Error",
            code: 500,
          },
        });
      }
    } else {
      console.log(`insert into OrderPost_customers succeeded:`);
      console.log(dbResponse);
      return res.json({ data: { dbResponse } });
    }
  });
};

const updateCustomer = async (req, res) => {
  const customerId = +req.params.customerId;
  const userId = req.userInfo.userId;
  console.log(customerId);

  let errors = [];

  if (!Number.isFinite(customerId)) {
    errors.push({
      status: "error",
      message: "Invalid 'customerId' parameter. It must be an integer.",
      code: 400,
    });
  }

  if (errors.length) {
    return res.status(400).json({ errors });
  }

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
    return res.status(400).json({
      errors: {
        status: "error",
        message: "request body contained no valid properties to update",
        code: 400,
      },
    });
  }
  // if here, then request body contains something to update.
  const { first_name, last_name, phone, email } = req.body;
  let sql = "UPDATE OrderPost_customers SET ";
  const params = [];

  if (first_name && typeof first_name == "string") {
    sql += `first_name = ?, `;
    params.push(first_name);
  }
  if (last_name && typeof last_name == "string") {
    sql += `last_name = ?, `;
    params.push(last_name);
  }
  if (phone && typeof phone == "string") {
    sql += `phone = ?, `;
    params.push(phone);
  }
  if (email && typeof email == "string") {
    sql += `email = ? `;
    params.push(email);
  }

  sql += "WHERE customer_id = ? AND user_id = ?";
  params.push(customerId, userId);
  console.log(sql);
  console.log(params);

  const updateResults = await db.query(sql, params, (err, dbResponse) => {
    console.log(dbResponse);
    console.log(dbResponse.affectedRows);
    console.log(dbResponse.affectedRows === 0);
    if (dbResponse.affectedRows === 0) {
      res.status(400).json({
        errors: {
          status: "error",
          message: "invalid customer_id",
          code: 400,
        },
      });
    } else if (err) {
      {
        res.status(500).json({
          errors: {
            status: "error",
            message: "internal server error",
            code: 500,
          },
        });
      }
    }
  });

  // I'm handling the success case out here
  // I want to return the updated object from getCustomerById
  const updatedCustomer = await getCustomerById(
    {
      // need to pass a correct object in the request
      userInfo: {
        userId: userId,
      },
      params: {
        customerId: customerId,
      },
    },
    // (this function call still needs access to updateCustomer's res argument)
    res
  );
  // This code is verging on spaghetti
  // or maybe a nice cacio e pepe
};

/*

If nothing gets updated:
0 row(s) affected Rows matched: 0  Changed: 0  Warnings: 0

*/

const deleteCustomer = (req, res) => {
  // creating scaffolding
  // will implement later

  const customerId = +req.params.customerId;
  let params = [customerId];

  let errors = [];
  // const customerId = +req.params.customerId;

  if (!Number.isFinite(customerId)) {
    errors.push({
      status: "error",
      message: "Invalid 'customerId' parameter. It must be an integer.",
      code: 400,
    });
  }

  if (errors.length) {
    return res.status(400).json({ errors });
  }

  let sql =
    "DELETE FROM OrderPost_customers where customer_id = ? AND user_id = ?";

  const userId = req.userInfo.userId;
  params.push(userId);
  db.query(sql, params, (err, dbResponse) => {
    if (err) {
      console.log(`an error occurred, `, err);
      res.status(500).json({
        errors: {
          status: "error",
          message: "internal server error",
          code: 500,
        },
      });
    } else if (dbResponse.affectedRows === 0) {
      res.status(400).json({
        errors: {
          status: "error",
          message: "invalid customer_id",
          code: 400,
        },
      });
    } else {
      res.json(dbResponse);
    }
  });
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
