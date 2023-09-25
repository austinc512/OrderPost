const db = require("../sql/db");

const listOrders = (req, res) => {
  // this one will take at least a size query param
  /*
    - GET /orders - return an array of orders (default size = 100)
    - GET /orders?size={size} - query param allowing you to change the size returned (max size = 500).
  */
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

  console.log(req.query.size);
  console.log(req.query.orderStatus);

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
  let orderStatus;
  if (req.query.orderStatus) {
    if (req.query.orderStatus === "unshipped") {
      orderStatus = "unshipped";
    } else if (req.query.orderStatus === "shipped") {
      orderStatus = "shipped";
    } else {
      errors.push({
        status: "error",
        message:
          "Invalid orderStatus parameter. possible values: shipped, unshipped",
        code: 400,
      });
    }
  } else {
    // default value
    orderStatus = "unshipped";
  }

  if (errors.length) {
    return res.status(400).json({ errors });
  }

  const validationSql = `SELECT o.*
  FROM OrderPost_orders o
  JOIN OrderPost_customers c ON o.customer_id = c.customer_id
  WHERE c.user_id = ? AND o.order_status = ?`;

  // res.json(`Coming Soon!`);
  db.query(validationSql, [userId, orderStatus], (err, dbResponse) => {
    if (err) {
      console.log(`an error occurred, `, err);
      res.status(500).json({
        errors: {
          status: "error",
          message: "internal server error",
          code: 500,
        },
      });
    } else {
      res.json({ data: dbResponse });
    }
  });
};

const getOrderById = (req, res) => {
  // creating scaffolding
  // will implement later
  res.json(`Coming Soon!`);
};

const createOrder = (req, res) => {
  // creating scaffolding
  // will implement later
  res.json(`Coming Soon!`);
};

const updateOrder = (req, res) => {
  // creating scaffolding
  // will implement later
  res.json(`Coming Soon!`);
};

// Shipments are generated from Orders, so that function also lives here

const createShipment = (req, res) => {
  // creating scaffolding
  // will implement later
  res.json(`Coming Soon!`);
};

module.exports = {
  listOrders,
  getOrderById,
  createOrder,
  updateOrder,
  createShipment,
};
