const db = require("../sql/db");

const listProducts = (req, res) => {
  const userId = req.userInfo.userId;
  let size = 100; // default value
  let offset = 0; // default value
  let errors = [];
  // offset can be multiplied by page number for pagination.

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

  // this pattern allows for multiple error messages

  if (errors.length) {
    return res.status(400).json({ errors });
  }

  let queryString =
    "SELECT * FROM OrderPost_products WHERE user_id = ? LIMIT ? OFFSET ?";

  db.query(queryString, [userId, size, offset], (err, rows) => {
    if (err) {
      console.log("listProducts query failed:");
      console.log(err);
      res.sendStatus(500); // it's the server's fault
    } else {
      console.log("listProducts query succeeded:");
      console.log(rows);
      return res.json({ data: rows });
    }
  });
};

const createProduct = (req, res) => {
  /* Looking for:
      {
          "product_name": "Test Product API 1",
          "price": 10.99,
          "description": "Description must be less than 150 characters."
      }
  */

  let errors = [];
  const userId = req.userInfo.userId;
  let { product_name, price, description } = req.body;
  // attempt to coerce price
  price = +price;

  // empty request body
  if (!req.body) {
    return res.status(400).json({
      errors: {
        status: "error",
        message: "Missing request body",
        code: 400,
      },
    });
  }
  // product_name errors
  if (typeof product_name !== "string") {
    errors.push({
      status: "error",
      message: "product_name is not a string",
      code: 400,
    });
  }
  if (!product_name) {
    errors.push({
      status: "error",
      message: "Missing product_name",
      code: 400,
    });
  }
  const checkNaN = isNaN(price);
  // price errors
  // I've already attempted to coerce it.
  if (typeof price !== "number" || checkNaN) {
    errors.push({
      status: "error",
      message: "price is not a number",
      code: 400,
    });
  }
  if (!price && !checkNaN) {
    errors.push({
      status: "error",
      message: "Missing price",
      code: 400,
    });
  }
  if (typeof price === "number" && !checkNaN && +price.toFixed(2) !== price) {
    errors.push({
      status: "error",
      message: "Too many decimal places in price",
      code: 400,
    });
  }
  // description errors
  if (!description) {
    errors.push({
      status: "error",
      message: "missing description",
      code: 400,
    });
  }
  if (typeof description !== "string") {
    errors.push({
      status: "error",
      message: "Description must be a string",
      code: 400,
    });
  }
  if (description.length > 150) {
    errors.push({
      status: "error",
      message: "Description must be 150 characters or less",
      code: 400,
    });
  }

  if (errors.length) {
    return res.status(400).json({ errors });
  }

  const params = [userId, product_name, price, description];

  // if nothing throws above, data should be valid.
  // db will have to determine if product name fails unique constraint, however

  // if you need to have multiple asynchronous queries,
  // then use db.querySync
  // if 1 query, use db.query

  let sql =
    "INSERT into OrderPost_products (user_id, product_name, price, description) VALUES (?, ?, ?, ?)";

  db.query(sql, params, (err, dbResponse) => {
    if (err) {
      console.log(`insert into OrderPost_products failed:`);
      console.log(err);
      console.log(err.code);
      if (err.code == "ER_DUP_ENTRY") {
        return res.status(400).json({
          errors: {
            status: "error",
            message: "Not a unique product name",
            code: 400,
          },
        });
      } else {
        return res.status(500).json({
          errors: {
            status: "error",
            message: "Internal server error",
            code: 500,
          },
        });
      }
    } else {
      console.log(`insert into OrderPost_products succeeded:`);
      console.log(dbResponse);
      return res.json({ data: dbResponse });
    }
  });
};

const getProductById = (req, res) => {
  const userId = req.userInfo.userId;
  const productId = +req.params.productId;
  let errors = [];

  const checkNaN = isNaN(productId);

  if (checkNaN) {
    errors.push({
      status: "error",
      message: "productId is not a number",
      code: 400,
    });
  }

  if (
    !checkNaN &&
    typeof productId === "number" &&
    Math.trunc(productId) !== productId
  ) {
    errors.push({
      status: "error",
      message: "productId must be an integer",
      code: 400,
    });
  }

  if (errors.length) {
    return res.status(400).json({ errors });
  }

  // need to use product_id and user_id
  let sql =
    "SELECT * FROM OrderPost_products WHERE user_id = ? AND product_id = ?";
  const params = [userId, productId];
  db.query(sql, params, (err, rows) => {
    if (err) {
      console.log(`SELECT from OrderPost_products by ID failed:`);
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
            message: "There are no products with this ID",
            code: 400,
          },
        });
        return;
      } else {
        console.log(`SELECT from OrderPost_products by ID was successful:`);
        console.log(rows);
        res.json(rows[0]);
      }
    }
  });
};

const updateProduct = (req, res) => {
  /*
    Looking for any of the three:
    {
        "product_name": "Test Product API 1",
        "price": 10.99,
        "description": "Description must be less than 150 characters."
    }
  */
  let errors = [{ forceFail: true }];
  const productId = +req.params.productId;
  let { product_name, price, description } = req.body;
  let sql = "UPDATE OrderPost_products SET ";
  const params = [];
  // if data is formatted correctly, append to SQL string.
  if (product_name && typeof product_name == "string") {
    sql += "product_name = ?, ";
    params.push(product_name);
  }
  //coerce price to number type (in case string is sent)
  price = +price;
  if (price && typeof price == "number") {
    sql += "price = ?, ";
    params.push(price);
  }
  if (description && typeof description == "string") {
    sql += "description = ? ";
    params.push(description);
  }

  if (errors.length) {
    return res.status(400).json({ errors });
  }

  // after adding updated columns, finish off SQL query
  sql += "WHERE product_id = ?";
  params.push(productId);
  db.query(sql, params, (err, dbResponse) => {
    if (err) {
      console.log("an error occurred:");
      console.log(err);
      if (err.code == "ER_DUP_ENTRY") {
        res.status(400).json(`Sorry, that product name is already reserved.`);
        return;
      }
      res.status(500).json(`somthing went wrong`);
      return;
    } else {
      console.log(dbResponse);
      res.json(`Product updated!!`);
    }
  });
};

const deleteProduct = (req, res) => {
  const productId = [req.params.productId];
  let sql = "DELETE FROM OrderPost_products where product_id = ?";
  let param = productId;

  db.query(sql, param, (err, dbRes) => {
    if (err) {
      console.log("error in delete statment");
      console.log(err);
      res.status(500).json(`something went wrong`);
      return;
    } else {
      if (dbRes.affectedRows == 0) {
        console.log(`${productId} is not a valid productId to delete`);
        res.status(400).json(`not a valid productId`);
      } else {
        console.log(`productId ${productId} deleted successfully`);
        res.json(`delete successful. Hope you don't regret it!!`);
        return;
      }
    }
  });
};

// using db.query when reading data
// using db.querySync when Inserting into db
// functions using querySync need to be marked async

module.exports = {
  listProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
};
