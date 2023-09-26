const db = require("../sql/db");

const { validateOrderInfo } = require("../utils/orderUtils");

const listOrders = (req, res) => {
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
  WHERE c.user_id = ? AND o.order_status = ?
  LIMIT ? OFFSET ?`;

  db.query(
    validationSql,
    [userId, orderStatus, size, offset],
    (err, dbResponse) => {
      if (err) {
        console.log(`an error occurred:`);
        console.log(err);
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
    }
  );
};

const getOrderById = (req, res) => {
  const userId = req.userInfo.userId;
  const orderId = +req.params.orderId;
  const sql = `SELECT o.*
  FROM OrderPost_orders o
  JOIN OrderPost_customers c ON o.customer_id = c.customer_id
  WHERE c.user_id = ? AND o.order_id = ?`;
  db.query(sql, [userId, orderId], (err, dbResponse) => {
    if (err) {
      console.log(`an error occurred:`);
      console.log(err);
      res.status(500).json({
        errors: {
          status: "error",
          message: "internal server error",
          code: 500,
        },
      });
    } else {
      res.json({ data: dbResponse[0] });
    }
  });
};

// NEW VERSION
const createOrder = async (req, res) => {
  const userId = req.userInfo.userId;
  let {
    customer_id,
    order_number,
    order_date,
    total_amount,
    order_status,
    ship_by_date,
    carrier_code,
    service_code,
    package_code,
    confirmation,
    order_weight,
    weight_units,
    dimension_x,
    dimension_y,
    dimension_z,
    dimension_units,
    warehouse_id,
  } = req.body;

  let errors = [];

  // utils error checks
  const utilsCheck = validateOrderInfo({
    order_number,
    order_date,
    total_amount,
    order_status,
    ship_by_date,
    carrier_code,
    service_code,
    package_code,
    confirmation,
    order_weight,
    weight_units,
    dimension_x,
    dimension_y,
    dimension_z,
    dimension_units,
  });

  if (utilsCheck) {
    errors.push(...utilsCheck);
  }

  // A note about service_code:
  // frontend should have logic to only show the relevant service_codes I support based on carrier_code
  // I'm not writing the conditional logic to match carrier/service for my MVP

  // DB error checks

  // customer_id must correspond to user_id
  if (customer_id) {
    const customerSql =
      "SELECT * FROM OrderPost_customers WHERE customer_id = ? AND user_id = ?";
    const customerParams = [customer_id, userId];
    let customerResults;
    try {
      customerResults = await db.querySync(customerSql, customerParams);
      console.log(customerResults.length);
      if (customerResults.length === 0) {
        {
          errors.push({
            status: "error",
            message: "invalid customer_id",
            code: 400,
          });
        }
      }
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
  }

  // warehouse_id must correspond to user_id
  if (warehouse_id) {
    const warehouseSql =
      "SELECT * FROM OrderPost_warehouses WHERE user_id = ? AND warehouse_id = ?";
    const warehouseParams = [userId, warehouse_id];
    let warehouseResults;
    try {
      warehouseResults = await db.querySync(warehouseSql, warehouseParams);
      if (warehouseResults.length === 0) {
        errors.push({
          status: "error",
          message: "invalid warehouse_id",
          code: 400,
        });
      }
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
  }

  if (errors.length) {
    return res.status(400).json({ errors });
  }

  // If here, then all values have passed validation
  // validation attempts to coerce some values to Number
  // but I need those Numbers back here in the primary function as well.
  // (this allows for numbers as strings to still be valid)
  total_amount = +total_amount;
  order_weight = +order_weight;
  dimension_x = +dimension_x;
  dimension_y = +dimension_y;
  dimension_z = +dimension_z;

  res.json(`Made it to the end!`);
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
