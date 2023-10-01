const db = require("../sql/db");

const { validateOrderInfo } = require("../utils/orderUtils");
const { createLabel } = require("../utils/shipEngineAPI");

/*

Notes:
There is a large amount of abstraction that needs to take place in this file.
there's a lot of recycled lines of code, and I'll clean this up later.

*/

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
  // THIS NEEDS TO BE REFACTORED INTO A UTILITY FUNCTION
  // ACTUALLY THIS ONE IS A BIT DIFFERENT
  const validationSql = `SELECT c.first_name, c.last_name, c.phone, c.email, s.address_line1, s.city_locality, s.state_province, s.postal_code, o.*
  FROM OrderPost_orders o
  JOIN OrderPost_customers c ON o.customer_id = c.customer_id
  JOIN OrderPost_ship_to s ON c.customer_id = s.customer_id
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
          errors: [
            {
              status: "error",
              message: "internal server error",
              code: 500,
            },
          ],
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
  // THIS NEEDS TO BE REFACTORED INTO A UTILITY FUNCTION
  const sql = `SELECT o.*
  FROM OrderPost_orders o
  JOIN OrderPost_customers c ON o.customer_id = c.customer_id
  WHERE c.user_id = ? AND o.order_id = ?`;
  db.query(sql, [userId, orderId], (err, dbResponse) => {
    if (err) {
      console.log(`an error occurred:`);
      console.log(err);
      res.status(500).json({
        errors: [
          {
            status: "error",
            message: "internal server error",
            code: 500,
          },
        ],
      });
    } else {
      res.json(dbResponse[0]);
    }
  });
};

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

  // originally order_number was checked in utils
  // however this complicates things for updateOrder (which also uses utils)
  // So I'm just putting it here instead.

  if (typeof order_number !== "string") {
    errors.push({
      status: "error",
      message: "order number must be a string",
      code: 400,
    });
  }
  if (
    typeof order_number === "string" &&
    (order_number.length === 0 || order_number.length > 20)
  ) {
    errors.push({
      status: "error",
      message: "order number must be between 1 and 15 characters long",
      code: 400,
    });
  }

  // A note about service_code:
  // frontend should have logic to only show the relevant service_codes I support based on carrier_code
  // I'm not writing the logic to match carrier/service for my MVP

  // DB error checks:

  // 1. customer_id must correspond to user_id
  if (customer_id) {
    const customerSql =
      "SELECT * FROM OrderPost_customers WHERE customer_id = ? AND user_id = ?";
    const customerParams = [customer_id, userId];
    let customerResults;
    try {
      customerResults = await db.querySync(customerSql, customerParams);
      // console.log(customerResults.length);
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
        errors: [
          {
            status: "error",
            message: "Internal Server Error",
            code: 500,
          },
        ],
      });
    }
  }

  // 2. warehouse_id must correspond to user_id
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
        errors: [
          {
            status: "error",
            message: "Internal Server Error",
            code: 500,
          },
        ],
      });
    }
  }

  if (errors.length) {
    return res.status(400).json({ errors });
  }

  // If here, then all values have passed validation
  // utils validation attempts to coerce some values to Number
  // but I need those Numbers back here in the primary function as well.
  // (this allows for numbers as strings to still be valid)
  total_amount = +total_amount;
  order_weight = +order_weight;
  dimension_x = +dimension_x;
  dimension_y = +dimension_y;
  dimension_z = +dimension_z;

  // Now I'm ready to write some SQL
  const starterChunk = "INSERT INTO OrderPost_orders";
  const columns = ["order_number"];
  const values = [order_number];

  if (customer_id) {
    columns.push("customer_id");
    values.push(customer_id);
  }
  if (order_date) {
    columns.push("order_date");
    values.push(order_date);
  }
  if (total_amount) {
    columns.push("total_amount");
    values.push(total_amount);
  }
  if (order_status) {
    columns.push("order_status");
    values.push(order_status);
  }
  if (ship_by_date) {
    columns.push("ship_by_date");
    values.push(ship_by_date);
  }
  if (carrier_code) {
    columns.push("carrier_code");
    values.push(carrier_code);
  }
  if (service_code) {
    columns.push("service_code");
    values.push(service_code);
  }
  if (package_code) {
    columns.push("package_code");
    values.push(package_code);
  }
  if (confirmation) {
    columns.push("confirmation");
    values.push(confirmation);
  }
  if (order_weight) {
    columns.push("order_weight");
    values.push(order_weight);
  }
  if (weight_units) {
    columns.push("weight_units");
    values.push(weight_units);
  }
  if (dimension_x) {
    columns.push("dimension_x");
    values.push(dimension_x);
  }
  if (dimension_y) {
    columns.push("dimension_y");
    values.push(dimension_y);
  }
  if (dimension_z) {
    columns.push("dimension_z");
    values.push(dimension_z);
  }
  if (warehouse_id) {
    columns.push("warehouse_id");
    values.push(warehouse_id);
  }
  if (dimension_units) {
    columns.push("dimension_units");
    values.push(dimension_units);
  }

  const valuesLength = new Array(values.length).fill("?");
  let sql = `${starterChunk} (${columns.join(
    ", "
  )}) VALUES (${valuesLength.join(", ")})`;
  // prettier did a gross thing there
  console.log(sql);
  console.log(values);

  let updatedResults;
  try {
    updatedResults = await db.querySync(sql, values);
    console.log(updatedResults);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      errors: [
        {
          status: "error",
          message: "Internal Server Error",
          code: 500,
        },
      ],
    });
  }
  // if here, INSERT was successful

  getOrderById(
    {
      userInfo: {
        userId: userId,
      },
      params: {
        orderId: updatedResults.insertId,
      },
    },
    res
  );

  // res.json(`Made it to the end!`);
};

const updateOrder = async (req, res) => {
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

  // DB error checks:

  // 1. customer_id must correspond to user_id
  if (customer_id) {
    const customerSql =
      "SELECT * FROM OrderPost_customers WHERE customer_id = ? AND user_id = ?";
    const customerParams = [customer_id, userId];
    let customerResults;
    try {
      customerResults = await db.querySync(customerSql, customerParams);
      // console.log(customerResults.length);
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
        errors: [
          {
            status: "error",
            message: "Internal Server Error",
            code: 500,
          },
        ],
      });
    }
  }

  // 3. order_id must correspond to user_id
  // THIS NEEDS TO BE REFACTORED INTO A UTILITY FUNCTION
  const orderId = +req.params.orderId;
  const verifyOrderSql = `SELECT o.*
  FROM OrderPost_orders o
  JOIN OrderPost_customers c ON o.customer_id = c.customer_id
  WHERE c.user_id = ? AND o.order_id = ?`;
  let orderResults;
  try {
    orderResults = await db.querySync(verifyOrderSql, [userId, orderId]);
    if (orderResults.length === 0) {
      errors.push({
        status: "error",
        message: "invalid order_id",
        code: 400,
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      errors: [
        {
          status: "error",
          message: "Internal Server Error",
          code: 500,
        },
      ],
    });
  }

  // 2. warehouse_id must correspond to user_id
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
        errors: [
          {
            status: "error",
            message: "Internal Server Error",
            code: 500,
          },
        ],
      });
    }
  }

  if (errors.length) {
    return res.status(400).json({ errors });
  }
  // if here, order data is valid.
  // order_number is no longer a required property to update order.
  // so now, I will not allow order_number to be updated.

  // orderId, customer_id are accessible.
  // these two will never change 'WHERE order_id = ?

  let updateSql = "UPDATE OrderPost_orders SET ";
  const updateParams = [];
  const updateColumns = [];

  if (order_date) {
    updateColumns.push("order_date = ?");
    updateParams.push(order_date);
  }
  if (total_amount) {
    updateColumns.push("total_amount = ?");
    updateParams.push(total_amount);
  }
  if (order_status) {
    updateColumns.push("order_status = ?");
    updateParams.push(order_status);
  }
  if (ship_by_date) {
    updateColumns.push("ship_by_date = ?");
    updateParams.push(ship_by_date);
  }
  if (carrier_code) {
    updateColumns.push("carrier_code = ?");
    updateParams.push(carrier_code);
  }
  if (service_code) {
    updateColumns.push("service_code = ?");
    updateParams.push(service_code);
  }
  if (package_code) {
    updateColumns.push("package_code = ?");
    updateParams.push(package_code);
  }
  if (confirmation) {
    updateColumns.push("confirmation = ?");
    updateParams.push(confirmation);
  }
  if (order_weight) {
    updateColumns.push("order_weight = ?");
    updateParams.push(order_weight);
  }
  if (weight_units) {
    updateColumns.push("weight_units = ?");
    updateParams.push(weight_units);
  }
  if (dimension_x) {
    updateColumns.push("dimension_x = ?");
    updateParams.push(dimension_x);
  }
  if (dimension_y) {
    updateColumns.push("dimension_y = ?");
    updateParams.push(dimension_y);
  }
  if (dimension_z) {
    updateColumns.push("dimension_z = ?");
    updateParams.push(dimension_z);
  }
  if (warehouse_id) {
    updateColumns.push("warehouse_id = ?");
    updateParams.push(warehouse_id);
  }

  updateSql += updateColumns.join(", ");
  updateSql += " WHERE order_id = ?";
  updateParams.push(orderId);

  // if updateParams.length === 0 return 'nothing to update'
  // hopefully I don't regret this later...
  if (updateParams.length === 0) {
    return res.status(400).json({
      errors: [
        {
          status: "error",
          message: "request contained no properties to update",
          code: 400,
        },
      ],
    });
  }
  // console.log(updateSql);
  console.log(updateParams);

  let updatedResults;
  try {
    updatedResults = await db.querySync(updateSql, updateParams);
    console.log(updatedResults);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      errors: [
        {
          status: "error",
          message: "Internal Server Error",
          code: 500,
        },
      ],
    });
  }

  // if here, UPDATE was successful

  getOrderById(
    {
      userInfo: {
        userId: userId,
      },
      params: {
        orderId: orderId,
      },
    },
    res
  );
};

// orderItems

const getOrderItems = async (req, res) => {
  // /:orderId/order-items

  // order has foreign key to customer
  // customer has foreign key to user

  // product has foreign key to user
  //    since this is a Read, I don't need to verify products belong to user
  //    but that will need to happen elsewhere

  // validate order belongs to user
  const userId = req.userInfo.userId;
  const orderId = +req.params.orderId;
  const errors = [];

  // orderId --> userId
  // 3. order_id must correspond to user_id
  // THIS NEEDS TO BE REFACTORED INTO A UTILITY FUNCTION
  const verifyOrderSql = `SELECT o.*
  FROM OrderPost_orders o
  JOIN OrderPost_customers c ON o.customer_id = c.customer_id
  WHERE c.user_id = ? AND o.order_id = ?`;
  let orderResults;
  try {
    orderResults = await db.querySync(verifyOrderSql, [userId, orderId]);
    if (orderResults.length === 0) {
      errors.push({
        status: "error",
        message: "invalid order_id",
        code: 400,
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      errors: [
        {
          status: "error",
          message: "Internal Server Error",
          code: 500,
        },
      ],
    });
  }

  // if errors, return
  if (errors.length) {
    return res.status(400).json({ errors });
  }

  // if here, order corresponds to user
  // then I can select order items
  const sql = "SELECT * FROM OrderPost_order_items WHERE order_id = ?";

  db.query(sql, [orderId], (err, dbResponse) => {
    if (err) {
      console.log(`an error occurred:`);
      console.log(err);
      res.status(500).json({
        errors: [
          {
            status: "error",
            message: "internal server error",
            code: 500,
          },
        ],
      });
    } else {
      res.json({ data: dbResponse });
    }
  });
};

const addOrderItem = async (req, res) => {
  // takes 1 item
  const userId = req.userInfo.userId;
  const orderId = +req.params.orderId;
  const { productId, quantity } = req.body;
  const errors = [];

  const isProductNaN = isNaN(productId);
  if (isProductNaN) {
    errors.push({
      status: "error",
      message: "productId is not a number",
      code: 400,
    });
  }
  if (
    !isProductNaN &&
    typeof productId === "number" &&
    Math.trunc(productId) !== productId
  ) {
    errors.push({
      status: "error",
      message: "productId must be an integer",
      code: 400,
    });
  }

  // if errors, return
  if (errors.length) {
    return res.status(400).json({ errors });
  }

  // 3. order_id must correspond to user_id
  // THIS NEEDS TO BE REFACTORED INTO A UTILITY FUNCTION
  const verifyOrderSql = `SELECT o.*
  FROM OrderPost_orders o
  JOIN OrderPost_customers c ON o.customer_id = c.customer_id
  WHERE c.user_id = ? AND o.order_id = ?`;
  let orderResults;
  try {
    orderResults = await db.querySync(verifyOrderSql, [userId, orderId]);
    if (orderResults.length === 0) {
      errors.push({
        status: "error",
        message: "invalid order_id",
        code: 400,
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      errors: [
        {
          status: "error",
          message: "Internal Server Error",
          code: 500,
        },
      ],
    });
  }

  // if here, order corresponds to user.

  // product must correspond to userId

  let verifyProductSql =
    "SELECT * FROM OrderPost_products WHERE user_id = ? AND product_id = ?";
  let productResults;
  try {
    productResults = await db.querySync(verifyProductSql, [userId, productId]);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      errors: [
        {
          status: "error",
          message: "Internal Server Error",
          code: 500,
        },
      ],
    });
  }
  if (productResults.length === 0) {
    return res.status(400).json({
      errors: [
        {
          status: "error",
          message: "There are no products with this product_id",
          code: 400,
        },
      ],
    });
  }
  // if here, product_id is valid and order corresponds to user
  // ready for insert
  const sql = `INSERT INTO OrderPost_order_items (order_id, product_id, quantity) VALUES (?, ?, ?)`;
  const params = [orderId, productId, quantity];
  let updatedResults;
  try {
    updatedResults = await db.querySync(sql, params);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      errors: [
        {
          status: "error",
          message: "Internal Server Error",
          code: 500,
        },
      ],
    });
  }

  // if here, INSERT was successful
  // respond with all order items
  getOrderItems(
    {
      userInfo: {
        userId: userId,
      },
      params: {
        orderId: orderId,
      },
    },
    res
  );
};

const updateOrderItem = async (req, res) => {
  // takes 1 item
  const userId = req.userInfo.userId;
  const orderId = +req.params.orderId;
  const { productId, quantity } = req.body;
  const errors = [];

  const isProductNaN = isNaN(productId);
  if (isProductNaN) {
    errors.push({
      status: "error",
      message: "productId is not a number",
      code: 400,
    });
  }
  if (
    !isProductNaN &&
    typeof productId === "number" &&
    Math.trunc(productId) !== productId
  ) {
    errors.push({
      status: "error",
      message: "productId must be an integer",
      code: 400,
    });
  }

  // if errors, return
  if (errors.length) {
    return res.status(400).json({ errors });
  }

  // 3. order_id must correspond to user_id
  // THIS NEEDS TO BE REFACTORED INTO A UTILITY FUNCTION
  const verifyOrderSql = `SELECT o.*
  FROM OrderPost_orders o
  JOIN OrderPost_customers c ON o.customer_id = c.customer_id
  WHERE c.user_id = ? AND o.order_id = ?`;
  let orderResults;
  try {
    orderResults = await db.querySync(verifyOrderSql, [userId, orderId]);
    if (orderResults.length === 0) {
      errors.push({
        status: "error",
        message: "invalid order_id",
        code: 400,
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      errors: [
        {
          status: "error",
          message: "Internal Server Error",
          code: 500,
        },
      ],
    });
  }

  // if here, order corresponds to user.

  // product must correspond to userId

  let verifyProductSql =
    "SELECT * FROM OrderPost_products WHERE user_id = ? AND product_id = ?";
  let productResults;
  try {
    productResults = await db.querySync(verifyProductSql, [userId, productId]);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      errors: [
        {
          status: "error",
          message: "Internal Server Error",
          code: 500,
        },
      ],
    });
  }
  if (productResults.length === 0) {
    return res.status(400).json({
      errors: [
        {
          status: "error",
          message: "There are no products with this product_id",
          code: 400,
        },
      ],
    });
  }
  // if here, product_id is valid and order corresponds to user
  // ready for insert
  const sql = `UPDATE OrderPost_order_items SET QUANTITY = ? WHERE order_id = ? AND product_id = ?`;
  const params = [quantity, orderId, productId];

  try {
    updatedResults = await db.querySync(sql, params);
    console.log(updatedResults.affectedRows);
    if (updatedResults.affectedRows === 0) {
      return res.status(400).json({
        errors: [
          {
            status: "error",
            message: "productId does not exist on order",
            code: 400,
          },
        ],
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      errors: [
        {
          status: "error",
          message: "Internal Server Error",
          code: 500,
        },
      ],
    });
  }

  // if here, UPDATE was successful
  // respond with all order items
  getOrderItems(
    {
      userInfo: {
        userId: userId,
      },
      params: {
        orderId: orderId,
      },
    },
    res
  );
};

const deleteOrderItem = async (req, res) => {
  // takes 1 item
  // takes 1 item
  const userId = req.userInfo.userId;
  const orderId = +req.params.orderId;
  const { productId } = req.body;
  const errors = [];

  const isProductNaN = isNaN(productId);
  if (isProductNaN) {
    errors.push({
      status: "error",
      message: "productId is not a number",
      code: 400,
    });
  }
  if (
    !isProductNaN &&
    typeof productId === "number" &&
    Math.trunc(productId) !== productId
  ) {
    errors.push({
      status: "error",
      message: "productId must be an integer",
      code: 400,
    });
  }

  // 3. order_id must correspond to user_id
  // THIS NEEDS TO BE REFACTORED INTO A UTILITY FUNCTION
  const verifyOrderSql = `SELECT o.*
   FROM OrderPost_orders o
   JOIN OrderPost_customers c ON o.customer_id = c.customer_id
   WHERE c.user_id = ? AND o.order_id = ?`;
  let orderResults;
  try {
    orderResults = await db.querySync(verifyOrderSql, [userId, orderId]);
    if (orderResults.length === 0) {
      errors.push({
        status: "error",
        message: "invalid order_id",
        code: 400,
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      errors: [
        {
          status: "error",
          message: "Internal Server Error",
          code: 500,
        },
      ],
    });
  }

  // if errors, return
  if (errors.length) {
    return res.status(400).json({ errors });
  }

  // if here, order corresponds to user.

  // product must correspond to userId

  let verifyProductSql =
    "SELECT * FROM OrderPost_products WHERE user_id = ? AND product_id = ?";
  let productResults;
  try {
    productResults = await db.querySync(verifyProductSql, [userId, productId]);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      errors: [
        {
          status: "error",
          message: "Internal Server Error",
          code: 500,
        },
      ],
    });
  }
  if (productResults.length === 0) {
    return res.status(400).json({
      errors: [
        {
          status: "error",
          message: "There are no products with this product_id",
          code: 400,
        },
      ],
    });
  }
  // if here, product_id is valid and order corresponds to user
  // ready for DELETE
  let deleteSql =
    "DELETE FROM OrderPost_order_items where order_id = ? AND product_id = ?";
  const deleteParams = [orderId, productId];
  let updatedResults;
  try {
    updatedResults = await db.querySync(deleteSql, deleteParams);
    if (updatedResults.affectedRows === 0) {
      return res.status(400).json({
        errors: [
          {
            status: "error",
            message: "productId does not exist on order",
            code: 400,
          },
        ],
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      errors: [
        {
          status: "error",
          message: "Internal Server Error",
          code: 500,
        },
      ],
    });
  }

  // if here, DELETE was successful
  // respond with all order items
  getOrderItems(
    {
      userInfo: {
        userId: userId,
      },
      params: {
        orderId: orderId,
      },
    },
    res
  );
};

// Shipments are generated from Orders, so that function also lives here

const createShipment = async (req, res) => {
  // this endpoint takes in an orderId
  const userId = req.userInfo.userId;
  const orderId = +req.params.orderId;
  const errors = [];
  // validate that order corresponds to user
  // THIS NEEDS TO BE REFACTORED INTO A UTILITY FUNCTION
  const verifyOrderSql = `SELECT o.*
  FROM OrderPost_orders o
  JOIN OrderPost_customers c ON o.customer_id = c.customer_id
  WHERE c.user_id = ? AND o.order_id = ?`;
  let orderResults;
  try {
    orderResults = await db.querySync(verifyOrderSql, [userId, orderId]);
    if (orderResults.length === 0) {
      errors.push({
        status: "error",
        message: "invalid order_id",
        code: 400,
      });
    } else if (orderResults[0].order_status === "shipped") {
      // if the order is already shipped, do not allow for another label to be created.
      return res.status(400).json({
        errors: [
          {
            status: "error",
            message:
              "Order is already in the 'shipped' status. Void the label to restore order to 'unshipped' status.",
            code: 500,
          },
        ],
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      errors: [
        {
          status: "error",
          message: "Internal Server Error",
          code: 400,
        },
      ],
    });
  }
  const targetOrder = orderResults[0];
  // vaidate that all the necessary props to make a label request exist
  if (!targetOrder.service_code) {
    return res.status(400).json({
      errors: [
        {
          status: "error",
          message: "Order is missing service_code",
          code: 400,
        },
      ],
    });
  }

  /*
  Creating customerAddress requirements: first_name, last_name, phone, address_line1, city_locality, state_province, postal_code, country_code
  
  Warehouses also has these requirements.

  Can count on this data being passed to ShipEngine.

  Currently I'm only allowing create/read/delete and not update for both customerAddress and Warehouse. The logic also looks for truthy values in order to write to DB for any of the properties.

  If I write logic to update either of these objects, then I probably will need to do some extra validation of customerAddress/Warehouse in this controller function.
  */

  // get customer address
  const shipToSql = `SELECT * FROM OrderPost_ship_to WHERE customer_id = ?`;
  const shipToParams = [targetOrder.customer_id];
  let shipTo;

  try {
    shipTo = await db.querySync(shipToSql, shipToParams);
    if (shipTo.length === 0) {
      return res.status(400).json({
        errors: [
          {
            status: "error",
            message: "No addresses have been created for this customer",
            code: 400,
          },
        ],
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      errors: [
        {
          status: "error",
          message: "Internal Server Error",
          code: 500,
        },
      ],
    });
  }

  // NOTE: ONLY DOING 1 ADDRESS PER CUSTOMER RIGHT NOW
  // CAN CHANGE THIS LATER
  const shipToAddress = shipTo[0];
  shipToAddress.name = `${shipToAddress.first_name.trim()} ${shipToAddress.last_name.trim()}`;

  // get Warehouse info
  if (!targetOrder.warehouse_id) {
    return res.status(400).json({
      errors: [
        {
          status: "error",
          message: "No warehouse_id associated with this order",
          code: 400,
        },
      ],
    });
  }

  let shipFrom;
  const shipFromSql = `SELECT * FROM OrderPost_warehouses WHERE warehouse_id = ?`;
  try {
    shipFrom = await db.querySync(shipFromSql, [targetOrder.warehouse_id]);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      errors: [
        {
          status: "error",
          message: "Internal Server Error",
          code: 500,
        },
      ],
    });
  }

  const shipFromAddress = shipFrom[0];
  shipFromAddress.name = `${shipFromAddress.first_name.trim()} ${shipFromAddress.last_name.trim()}`;

  // create shipmentObject
  const shipmentObject = {
    shipment: {
      service_code: null,
      ship_to: null,
      ship_from: null,
      packages: [],
    },
  };
  // hydrate shipmentObject with data
  shipmentObject.shipment.service_code = targetOrder.service_code;
  shipmentObject.shipment.ship_to = shipToAddress;
  shipmentObject.shipment.ship_from = shipFromAddress;

  shipmentObject.shipment.packages.push({
    weight: {
      value: targetOrder.order_weight,
      unit: targetOrder.weight_units,
    },
    dimensions: {
      height: targetOrder.dimension_x,
      width: targetOrder.dimension_y,
      length: targetOrder.dimension_z,
      unit: targetOrder.dimension_units,
    },
  });

  const response = await createLabel(shipmentObject);
  if (response.errors) {
    return res.status(500).json(...response.errors);
  }
  // if here, we have a label response
  console.log(targetOrder);
  // update order to "shipped" status.
  const updateOrderSql = `UPDATE OrderPost_orders SET order_status = 'shipped' WHERE order_id = ?`;
  let updateSuccessful;
  try {
    updateSuccessful = await db.querySync(updateOrderSql, [
      targetOrder.order_id,
    ]);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      errors: [
        {
          status: "error",
          message: "Internal Server Error",
          code: 500,
        },
      ],
    });
  }

  // upon success, create shipment record
  const createShipmentSql = `INSERT INTO OrderPost_shipments
  (order_id, order_number, order_date, total_amount, ship_by_date, carrier_code, service_code, package_code, confirmation, order_weight, weight_units, dimension_x, dimension_y, dimension_z, dimension_units, label_reference)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const createShipmentParams = [
    targetOrder.order_id,
    targetOrder.order_number,
    targetOrder.order_date,
    targetOrder.total_amount,
    targetOrder.ship_by_date,
    targetOrder.carrier_code,
    targetOrder.service_code,
    targetOrder.package_code,
    targetOrder.confirmation,
    targetOrder.order_weight,
    targetOrder.weight_units,
    targetOrder.dimension_x,
    targetOrder.dimension_y,
    targetOrder.dimension_z,
    targetOrder.dimension_units,
    response.data.label_download.pdf,
  ];

  let createShipment;
  try {
    createShipment = await db.querySync(
      createShipmentSql,
      createShipmentParams
    );
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      errors: [
        {
          status: "error",
          message: "Internal Server Error",
          code: 500,
        },
      ],
    });
  }

  // respond with the label href (I think that's the best approach)
  res.json({ label_download: response.data.label_download.pdf });
};

module.exports = {
  listOrders,
  getOrderById,
  createOrder,
  updateOrder,
  createShipment,
  getOrderItems,
  addOrderItem,
  updateOrderItem,
  deleteOrderItem,
};
