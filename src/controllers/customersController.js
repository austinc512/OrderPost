const db = require("../sql/db");
const { validateAddress } = require("../utils/shipEngineAPI");

// how do I get current userId from the requester?

const listCustomers = (req, res) => {
  const userId = req.userInfo.userId;
  let size = 100; // default value
  let offset = 0; // default value
  let errors = [];

  /*
  frontend will handle pagination via offset parameter
  offset = (pageNumber - 1) * size

  So if I have 100 products, and I click 'next page',
  it seems like I'll just have an empty page
  I'll need to figure out how to prevent this later.

  if data.length < size, disable next page button.
  */

  if (req.query.size) {
    size = +req.query.size;
    if (!Number.isFinite(size) || size > 500 || size < 1) {
      errors.push({
        status: "error",
        message:
          "Invalid 'size' parameter. It must be an integer between 1 and 500.",
        code: 400,
      });
    }
  }

  if (req.query.offset) {
    offset = +req.query.offset;
    if (!Number.isFinite(offset) || offset < 0) {
      errors.push({
        status: "error",
        message: "Invalid 'offset' parameter. It must be a positive integer.",
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
      console.error("SELECT * FROM OrderPost_customers failed:");
      console.log(err);
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

const createCustomer = async (req, res) => {
  /*
  {
    "first_name": "First",
    "last_name": "Last",
    "phone": "512-555-4444",
    "email": "name@email.com"
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

  // NEW CODE START
  let updatedResults;

  try {
    updatedResults = await db.querySync(sql, params);
  } catch (err) {
    //
    console.log(`INSERT into OrderPost_customers failed:`);
    console.log(err);
    if (err.code == "ER_DUP_ENTRY") {
      return res.status(400).json({
        errors: {
          status: "error",
          message: "Not a unique customer",
          code: 400,
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
  }
  // if here, INSERT was successful
  console.log(
    `new customer created, will call getCustomerById with productId ${updatedResults.insertId}`
  );
  getCustomerById(
    {
      userInfo: {
        userId: userId,
      },
      params: {
        customerId: updatedResults.insertId,
      },
    },
    // (getProductById still needs access to createCustomer's res parameter)
    res
    // the response from getCustomerById becomes the response of createCustomer
  );
};

const updateCustomer = async (req, res) => {
  const customerId = +req.params.customerId;
  const userId = req.userInfo.userId;
  console.log(customerId);

  let errors = [];

  if (!Number.isFinite(customerId)) {
    errors.push({
      status: "error",
      message: "Invalid 'customerId' parameter. It must be a positive integer.",
      code: 400,
    });
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
    errors.push({
      status: "error",
      message: "request body contained no valid properties to update",
      code: 400,
    });
  }
  if (errors.length) {
    console.log("updateCustomer error(s):", errors);
    return res.status(400).json({ errors });
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
  console.log("updateCustomer sql and params:");
  console.log(sql);
  console.log(params);

  let updatedResults;

  try {
    updatedResults = await db.querySync(sql, params);
    if (updatedResults.affectedRows === 0) {
      return res.status(400).json({
        errors: {
          status: "error",
          message: "invalid customer_id",
          code: 400,
        },
      });
    }
  } catch (err) {
    console.log("A more sinister updateCustomer error occurred:");
    console.log(err);
    return res.status(500).json({
      errors: {
        status: "error",
        message: "internal server error",
        code: 500,
      },
    });
  }

  // wrangling parameters together to make function call:
  getCustomerById(
    {
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

const deleteCustomer = (req, res) => {
  const customerId = +req.params.customerId;
  let params = [customerId];

  let errors = [];

  if (!Number.isFinite(customerId)) {
    errors.push({
      status: "error",
      message: "Invalid 'customerId' parameter. It must be a positive integer.",
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

/*

A QUICK NOTE:
customer addresses is still designed to create more than
one address per customer

but other logic for creating a shipment will only grab the first
address from the customer.

This is to save time during the MVP process, but should be 
re-written later to either definitively support or NOT 
support multiple-address functionality

I think it will NOT support multiple addresses.

Makes an issue occur in listOrders.

*/

const getCustomerAddresses = (req, res) => {
  // GET /customers/:customerId/addresses
  const customerId = +req.params.customerId;
  const userId = req.userInfo.userId;

  // join OrderPost_ship_to and OrderPost_customers tables to ensure the customer_id corresponds to the user_id.
  const sql = `
    SELECT s.* 
    FROM OrderPost_ship_to AS s
    JOIN OrderPost_customers AS c ON s.customer_id = c.customer_id
    WHERE s.customer_id = ? AND c.user_id = ?;
  `;

  db.query(sql, [customerId, userId], (err, results) => {
    if (err) {
      return res.status(500).json({
        errors: {
          status: "error",
          message: "Internal server error",
          code: 500,
        },
      });
    }
    res.json({ data: results });
  });
};

const verifyCustomerAddress = async (req, res) => {
  // RESIDENTIAL ADDRESS INDICATOR TO SHIPENGINE
  /*
  Default: "unknown"
  Enum: "unknown" "yes" "no"
  */
  const response = await validateAddress(req);
  if (response.status === 200) {
    res.json(response.data[0]);
    // ^^ accessing the 0th index because my endpoint only accepts 1 address object
  } else {
    res
      .status(500)
      .json({ error: "Address Validation Failed", details: response.data });
  }
};

const createCustomerAddress = async (req, res) => {
  const customerId = +req.params.customerId;
  const userId = req.userInfo.userId;

  // validate that the customer_id belong to the user_id
  const validationSql = `SELECT * FROM OrderPost_customers WHERE customer_id = ? AND user_id = ?;`;
  let vaildationResult;
  try {
    vaildationResult = await db.querySync(validationSql, [customerId, userId]);
  } catch (err) {
    console.log(`SELECT * FROM OrderPost_customers failed:`);
    console.log(err);
    return res.status(500).json({
      errors: {
        status: "error",
        message: "Internal Server Error",
        code: 500,
      },
    });
  }
  if (vaildationResult.length === 0) {
    return res.status(400).json({
      errors: {
        status: "error",
        message: "Not a valid customer_id",
        code: 400,
      },
    });
  }

  // if it's a valid customer_id, validate API request data
  const errors = [];
  const {
    first_name,
    last_name,
    phone,
    email,
    company_name,
    address_line1,
    address_line2,
    address_line3,
    city_locality,
    state_province,
    postal_code,
    country_code,
    address_residential_indicator,
  } = req.body;
  if (
    !first_name ||
    !last_name ||
    !phone ||
    !address_line1 ||
    !city_locality ||
    !state_province ||
    !postal_code ||
    !country_code
  ) {
    errors.push({
      status: "error",
      message:
        "One or more required properties are missing. Requirements: first_name, last_name, phone, address_line1, city_locality, state_province, postal_code, country_code",
      code: 400,
    });
  }
  if (
    typeof first_name !== "string" ||
    typeof last_name !== "string" ||
    typeof phone !== "string" ||
    typeof address_line1 !== "string" ||
    typeof city_locality !== "string" ||
    typeof state_province !== "string" ||
    typeof postal_code !== "string" ||
    typeof country_code !== "string"
  ) {
    errors.push({
      status: "error",
      message: "value of a required property is not of type string",
      code: 400,
    });
  }
  // if errors, return
  if (errors.length) {
    return res.status(400).json({ errors });
  }

  const starterChunk = "INSERT INTO OrderPost_ship_to";

  const columns = [
    "customer_id",
    "first_name",
    "last_name",
    "phone",
    "address_line1",
    "city_locality",
    "state_province",
    "postal_code",
    "country_code",
  ];
  const values = [
    customerId,
    first_name,
    last_name,
    phone,
    address_line1,
    city_locality,
    state_province,
    postal_code,
    country_code,
  ];
  // for these non-"required" properties, I don't have any explicit error handling if they're the wrong data type, but I just won't write them to DB
  if (email && typeof email === "string") {
    columns.push("email");
    values.push(email);
  }
  if (company_name && typeof company_name === "string") {
    columns.push("company_name");
    values.push(company_name);
  }
  if (address_line2 && typeof address_line2 === "string") {
    columns.push("address_line2");
    values.push(address_line2);
  }
  if (address_line3 && typeof address_line3 === "string") {
    columns.push("address_line3");
    values.push(address_line3);
  }
  if (
    address_residential_indicator === "yes" ||
    address_residential_indicator === "no" ||
    address_residential_indicator === "unknown"
  ) {
    columns.push("address_residential_indicator");
    values.push(address_residential_indicator);
  } else {
    columns.push("address_residential_indicator");
    values.push("unknown");
  }
  const valuesLength = new Array(values.length).fill("?");
  let sql = `${starterChunk} (${columns.join(
    ", "
  )}) VALUES (${valuesLength.join(", ")})`;
  // prettier did a gross thing there
  console.log(sql);
  console.log(values);

  // if valid data, then INSERT
  let updatedResults;
  try {
    updatedResults = await db.querySync(sql, values);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      errors: {
        status: "error",
        message: "Internal Server Error",
        code: 500,
      },
    });
  }

  getAddressById(
    {
      userInfo: {
        userId: userId,
      },
      params: {
        addressId: updatedResults.insertId,
        customerId: customerId,
      },
    },
    res
  );
};

const getAddressById = async (req, res) => {
  // /:customerId/addresses/:addressId
  const customerId = +req.params.customerId;
  const addressId = +req.params.addressId;
  const userId = req.userInfo.userId;

  // validate that the customer_id belong to the user_id
  const validationSql = `SELECT * FROM OrderPost_customers WHERE customer_id = ? AND user_id = ?;`;
  let vaildationResult;
  try {
    vaildationResult = await db.querySync(validationSql, [customerId, userId]);
  } catch (err) {
    console.log(`SELECT * FROM OrderPost_customers failed:`);
    console.log(err);
    return res.status(500).json({
      errors: {
        status: "error",
        message: "Internal Server Error",
        code: 500,
      },
    });
  }
  if (vaildationResult.length === 0) {
    return res.status(400).json({
      errors: {
        status: "error",
        message: "Not a valid customer_id",
        code: 400,
      },
    });
  }

  // if it's a valid customer_id, allow SELECT
  const sql = `SELECT * FROM OrderPost_ship_to WHERE customer_id = ? AND ship_to_id = ?`;
  db.query(sql, [customerId, addressId], (err, rows) => {
    if (err) {
      console.log(
        `SELECT * FROM OrderPost_ship_to WHERE customer_id = ? AND ship_to_id = ?:`
      );
      console.log(err);
      res.status(500).json({
        errors: {
          status: "error",
          message: "Internal server error",
          code: 500,
        },
      });
    } else {
      if (rows.length === 0) {
        res.status(400).json({
          errors: {
            status: "error",
            message: "There are no customer addresses with this addressId",
            code: 400,
          },
        });
        return;
      } else {
        console.log(`SELECT from OrderPost_ship_to by ID was successful:`);
        console.log(rows);
        res.json(rows[0]);
      }
    }
  });
};

const updateAddressById = async (req, res) => {
  const customerId = +req.params.customerId;
  const addressId = +req.params.addressId;
  const userId = req.userInfo.userId;

  // validate that the customer_id and ship_to_id belong to the user_id
  const validationSql = `SELECT OrderPost_ship_to.* FROM OrderPost_ship_to
  JOIN OrderPost_customers
  ON OrderPost_customers.customer_id = OrderPost_ship_to.customer_id
  WHERE OrderPost_customers.customer_id = ? AND user_id = ? AND ship_to_id = ?;`;
  let vaildationResult;
  try {
    vaildationResult = await db.querySync(validationSql, [
      customerId,
      userId,
      addressId,
    ]);
  } catch (err) {
    console.log(`SELECT * FROM OrderPost_customers failed:`);
    console.log(err);
    return res.status(500).json({
      errors: {
        status: "error",
        message: "Internal Server Error",
        code: 500,
      },
    });
  }
  if (vaildationResult.length === 0) {
    return res.status(400).json({
      errors: {
        status: "error",
        message: "Not a valid ship_to_id",
        code: 400,
      },
    });
  }

  // if it's a valid customer_id, validate API request data
  const errors = [];
  const {
    first_name,
    last_name,
    phone,
    email,
    company_name,
    address_line1,
    address_line2,
    address_line3,
    city_locality,
    state_province,
    postal_code,
    country_code,
    address_residential_indicator,
  } = req.body;
  if (
    !first_name ||
    !last_name ||
    !phone ||
    !address_line1 ||
    !city_locality ||
    !state_province ||
    !postal_code ||
    !country_code
  ) {
    errors.push({
      status: "error",
      message:
        "One or more required properties are missing. Requirements: first_name, last_name, phone, address_line1, city_locality, state_province, postal_code, country_code",
      code: 400,
    });
  }

  if (
    typeof first_name !== "string" ||
    typeof last_name !== "string" ||
    typeof phone !== "string" ||
    typeof address_line1 !== "string" ||
    typeof city_locality !== "string" ||
    typeof state_province !== "string" ||
    typeof postal_code !== "string" ||
    typeof country_code !== "string"
  ) {
    errors.push({
      status: "error",
      message: "value of a required property is not of type string",
      code: 400,
    });
  }
  // if errors, return
  if (errors.length) {
    return res.status(400).json({ errors });
  }

  const sql = `UPDATE OrderPost_ship_to
SET first_name = ?, last_name = ?, phone = ?, address_line1 = ?, city_locality = ?, state_province = ?, 
postal_code = ?, country_code = ?, email = ?, company_name = ?, address_line2 = ?, 
address_line3 = ?, address_residential_indicator = ?
WHERE ship_to_id = ?;`;

  const values = [
    first_name,
    last_name,
    phone,
    address_line1,
    city_locality,
    state_province,
    postal_code,
    country_code,
  ];
  // use case:
  // old address had address_line2, but new address does not
  // if the variable is falsey, I need to insert null
  // this is more of a hot-fix than an elegant solution
  if (email && typeof email === "string") {
    values.push(email);
  } else values.push(null);

  if (company_name && typeof company_name === "string") {
    values.push(company_name);
  } else values.push(null);

  if (address_line2 && typeof address_line2 === "string") {
    values.push(address_line2);
  } else values.push(null);

  if (address_line3 && typeof address_line3 === "string") {
    values.push(address_line3);
  } else values.push(null);

  if (
    address_residential_indicator === "yes" ||
    address_residential_indicator === "no" ||
    address_residential_indicator === "unknown"
  ) {
    values.push(address_residential_indicator);
  } else values.push("unknown");

  values.push(customerId);
  // sql and values are formatted correctly now
  // console.log(sql);
  // console.log(values);

  // if valid data, then INSERT
  try {
    await db.querySync(sql, values);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      errors: {
        status: "error",
        message: "Internal Server Error",
        code: 500,
      },
    });
  }

  // if SQL statement is successful, return the actual address.
  getAddressById(
    {
      userInfo: {
        userId: userId,
      },
      params: {
        addressId,
        customerId,
      },
    },
    res
  );
};

const deleteAddressById = async (req, res) => {
  // /:customerId/addresses/:addressId
  const customerId = +req.params.customerId;
  const addressId = +req.params.addressId;
  const userId = req.userInfo.userId;
  // validate that the customer_id belong to the user_id
  const validationSql = `SELECT * FROM OrderPost_customers WHERE customer_id = ? AND user_id = ?;`;
  let vaildationResult;
  try {
    vaildationResult = await db.querySync(validationSql, [customerId, userId]);
  } catch (err) {
    console.log(`SELECT * FROM OrderPost_customers failed:`);
    console.log(err);
    return res.status(500).json({
      errors: {
        status: "error",
        message: "Internal Server Error",
        code: 500,
      },
    });
  }
  if (vaildationResult.length === 0) {
    return res.status(400).json({
      errors: {
        status: "error",
        message: "Not a valid customer_id",
        code: 400,
      },
    });
  }
  // if it's a valid customer_id, allow DELETE
  let sql =
    "DELETE FROM OrderPost_ship_to WHERE customer_id = ? AND ship_to_id = ?";
  const params = [customerId, addressId];
  db.query(sql, params, (err, dbResponse) => {
    if (err) {
      console.log(`an error occurred: `);
      console.log(err);
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
          message: "invalid customer address ID",
          code: 400,
        },
      });
    } else {
      res.json({ message: "customer address deleted successfully" });
    }
  });
};

module.exports = {
  listCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerAddresses,
  verifyCustomerAddress,
  createCustomerAddress,
  getAddressById,
  updateAddressById,
  deleteAddressById,
};
