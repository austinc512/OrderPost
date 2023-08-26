const db = require("../sql/db");

const listCustomers = (req, res) => {
  let sql = "SELECT * FROM OrderPost_customers LIMIT 100";
  // I still need to implement sizing
  db.query(sql, (err, rows) => {
    if (err) {
      console.log("SELECT * FROM OrderPost_customers LIMIT 100 failed:");
      console.log(err);
      res.status(500).json(err);
      return;
    } else {
      console.log(
        "SELECT * FROM OrderPost_customers LIMIT 100 returned results:"
      );
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
  // console.log(customerId);
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

module.exports = {
  listCustomers,
  getCustomerById,
};
