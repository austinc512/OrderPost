const db = require("../sql/db");

const listCustomers = (req, res) => {
  let sql = "SELECT * FROM OrderPost_customers LIMIT 100";
  db.query(sql, (err, rows) => {
    if (err) {
      console.log(err);
      res.status(500).json(err);
      return;
    } else {
      console.log(rows);
      res.json(rows);
      return;
    }
  });
  //   res.json(`inside listCustomers block`);
};

module.exports = {
  listCustomers,
};
