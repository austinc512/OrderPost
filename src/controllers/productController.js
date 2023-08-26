const db = require("../sql/db");

const listProducts = (req, res) => {
  let queryString = "SELECT * FROM OrderPost_products LIMIT 100";

  // if size param can be coerced into a number, update queryString
  if (req.query.size) {
    console.log(`size is being sent`);
    const size = +req.query.size;
    // using isFinite over isNaN method
    if (Number.isFinite(size)) {
      console.log(`size is a number`);
      if (size > 500) {
        res.status(400).json(`size param is too big`);
        return;
      } else if (size < 1) {
        res.status(400).json(`size param is too small`);
        return;
      }
      queryString = `SELECT * FROM OrderPost_products LIMIT ${size}`;
    } else {
      console.log(`size is sent, but size cannot be coerced into a number`);
      res.status(400).json(`size param looks incorrect`);
      return;
    }
  }

  db.query(queryString, (err, rows) => {
    if (err) {
      console.log("listProducts query failed:");
      console.log(err);
      res.sendStatus(500); // it's the server's fault
    } else {
      console.log("listProducts query succeeded:");
      console.log(rows);
      return res.json(rows);
    }
  });
};

const createProduct = (req, res) => {
  /*
    Looking for:
    {
        "product_name": "Test Product API 1",
        "price": 10.99,
        "description": "Description must be less than 150 characters."
    }
*/

  if (
    !req.body ||
    !req.body.product_name ||
    !req.body.price ||
    !req.body.description
  ) {
    console.log("A falsy value was sent in the createProduct request body");
    res
      .status(400)
      .json("A required property in the request has a falsy value");
    return;
  }

  let { product_name, price, description } = req.body;
  console.log(product_name);
  console.log(price, typeof price);
  console.log(description);

  // coerce price
  price = +price;
  // I'm not doing any favors the other properties of request
  // Now if datatypes are incorrent, then return errors
  if (!Number.isFinite(price)) {
    console.log(`price is not a num`);
  } else if (typeof product_name != "string") {
    console.log(`product_name wrong type`);
    res.status(400).json(`product name looks incorrect`);
    return;
  } else if (typeof description != "string") {
    console.log(`description wrong type`);
    res.status(400).json(`description looks incorrect`);
    return;
  }

  const params = [product_name, price, description];

  // if nothing throws above, data is valid.
  // product names need to be unique

  // if you need to have multiple asynchronous queries,
  // then use db.querySync
  // if 1 query, use db.query

  let sql =
    "INSERT into OrderPost_products (product_name, price, description) VALUES (?, ?, ?)";

  db.query(sql, params, (err, dbResponse) => {
    if (err) {
      console.log(`insert into OrderPost_products failed:`);
      console.log(err);
      console.log(err.code);
      if (err.code == "ER_DUP_ENTRY") {
        res.status(400).json(`not a unique product name`);
        return;
      } else {
        res.status(500).json(`something failed`);
        return;
      }
    } else {
      console.log(`insert into OrderPost_products succeeded:`);
      console.log(dbResponse);
      return res.json(dbResponse);
    }
  });
};

const getProductById = (req, res) => {
  const productId = [req.params.productId];
  let sql = "SELECT * FROM OrderPost_products WHERE product_id = ?";
  db.query(sql, productId, (err, rows) => {
    if (err) {
      console.log(`SELECT from OrderPost_products by ID failed:`);
      console.log(err);
    } else {
      if (rows.length === 0) {
        res.status(400).json(`There are no products with this ID`);
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
