const db = require("../sql/db");

/*
Note: I'm doing all of this by orderId right now
If I support multiple packages per order in the future,
(which most likely will happen) I'll need to re-do
pretty much this whole controller file.
*/

const listShipments = (req, res) => {
  // creating scaffolding
  // will implement later
  // this one will take at least a size query param
  /*
      - GET /shipments - return an array of shipments (default size = 100)
      - GET /shipments?size={size} - query param allowing you to change the size returned (max size = 500).
  */
  const userId = req.userInfo.userId;
  const sql = `SELECT s.*
  FROM OrderPost_shipments s
  JOIN OrderPost_orders o ON o.order_id = s.order_id
  JOIN OrderPost_customers c ON o.customer_id = c.customer_id
  WHERE c.user_id = ?
  LIMIT 1000;`;

  // res.json(`Coming Soon!`);
  db.query(sql, [userId], (err, dbResponse) => {
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

const getShipmentByOrderId = (req, res) => {
  const userId = req.userInfo.userId;
  const orderId = +req.params.orderId;
  const sql = `SELECT s.*
  FROM OrderPost_shipments s
  JOIN OrderPost_orders o ON o.order_id = s.order_id
  JOIN OrderPost_customers c ON o.customer_id = c.customer_id
  WHERE c.user_id = ?  AND o.order_id = ?;`;
  // res.json(`Coming Soon!`);
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
      res.json(dbResponse);
    }
  });
};

const deleteShipmentByOrderId = async (req, res) => {
  const orderId = +req.params.orderId;
  const userId = req.userInfo.userId;

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

  const sql = `DELETE s
  FROM OrderPost_shipments s
  JOIN OrderPost_orders o ON o.order_id = s.order_id
  JOIN OrderPost_customers c ON o.customer_id = c.customer_id
  WHERE c.user_id = ? AND o.order_id = ?;`;
  // I should also note that voiding the label would occur here
  // for the MVP using a sandbox API key, I won't implement this right now to save time.
  // res.json(`Coming Soon!`);
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
      if (dbResponse.affectedRows === 0) {
        return res.status(400).json({
          errors: [
            {
              status: "error",
              message: "No labels could be voided",
              code: 400,
            },
          ],
        });
      }
      // ensure order gets set back to unshipped before responding
      let setOrderStatus;
      let setOrderStatusSql = `UPDATE OrderPost_orders SET order_status = "unshipped"`;
      try {
        setOrderStatus = db.querySync(setOrderStatusSql);
      } catch (err) {
        console.log(err);
        return res.status(500).json({
          errors: [
            {
              status: "error",
              message: "internal server error",
              code: 500,
            },
          ],
        });
      }
      // this one is from the regular db.query
      res.json({ data: dbResponse });
    }
  });
  // maybe void label logic goes here.
  // or maybe this should stay in sync with the other actions.
};

module.exports = {
  listShipments,
  getShipmentByOrderId,
  deleteShipmentByOrderId,
};
