const db = require("../sql/db");
const { validateAddress } = require("../utils/shipEngineAPI");

const listWarehouses = (req, res) => {
  // there shouldn't be 10,000 warehouses
  // so I'm just gonna return all for the user
  // The specter of ShipStation is laughing at me
  const userId = [req.userInfo.userId];
  const sql = "SELECT * FROM OrderPost_warehouses WHERE user_id = ?";

  db.query(sql, userId, (err, rows) => {
    if (err) {
      console.error("SELECT * FROM OrderPost_warehouses failed:");
      console.log(err);
      return res.status(500).json({
        status: "error",
        message: "Internal Server Error",
        code: 500,
      });
    } else {
      res.json({
        data: rows,
      });
    }
  });
};

const getWarehouseById = (req, res) => {
  const userId = req.userInfo.userId;
  const warehouseId = +req.params.warehouseId;
  console.log(`making sure`);
  console.log({ userId, warehouseId });

  const errors = [];
  const checkNaN = isNaN(warehouseId);
  if (checkNaN) {
    errors.push({
      status: "error",
      message: "warehouseId is not a number",
      code: 400,
    });
  }
  if (errors.length) {
    return res.status(400).json({ errors });
  }
  let sql =
    "SELECT * FROM OrderPost_warehouses WHERE user_id = ? AND warehouse_id = ?";
  const params = [userId, warehouseId];
  db.query(sql, params, (err, rows) => {
    if (err) {
      console.log(
        `SELECT * FROM OrderPost_warehouses WHERE user_id = ? AND warehouse_id = ? failed:`
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
            message: "There are no warehouses with this warehouse_id",
            code: 400,
          },
        });
        return;
      } else {
        console.log(`SELECT from OrderPost_warehouses by ID was successful:`);
        console.log(rows);
        res.json(rows[0]);
      }
    }
  });
};

const verifyWarehouse = async (req, res) => {
  // this implementation is designed to check 1 address
  const response = await validateAddress(req);
  // if later I decide to send more than 1 address,
  // the logic below needs to be changed
  if (response.status === 200) {
    res.json(response.data[0]);
    // ^^ accessing the 0th index because my endpoint only accepts 1 address object
  } else {
    res
      .status(500)
      .json({ error: "Address Validation Failed", details: response.data });
  }
  // error response is an object with "error" property
};

const createWarehouse = async (req, res) => {
  // this function is called by the client AFTER verifyWarehouse.
  // it gives the user a chance to manually edit address returned from ShipEngine. Then we store this address in the DB.
  const userId = req.userInfo.userId;
  let errors = [];
  // note: this is the actual order of columns in DB
  const {
    first_name,
    last_name,
    nick_name,
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
  console.log({
    first_name,
    last_name,
    nick_name,
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
  });

  if (
    !first_name ||
    !last_name ||
    !nick_name ||
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
        "One or more required properties are missing. Requirements: first_name, last_name, nick_name, phone, address_line1, city_locality, state_province, postal_code, country_code",
      code: 400,
    });
  }
  /*
  if type of required prop !== 'string',
  push error
  */

  console.log(`CHECK HERE`);
  console.log(last_name, typeof last_name);
  if (
    typeof first_name !== "string" ||
    typeof last_name !== "string" ||
    typeof nick_name !== "string" ||
    typeof phone !== "string" ||
    typeof address_line1 !== "string" ||
    typeof city_locality !== "string" ||
    typeof state_province !== "string" ||
    typeof postal_code !== "string" ||
    typeof country_code !== "string"
  ) {
    errors.push({
      status: "error",
      message: "value of a required property is not a string",
      code: 400,
    });
  }

  // if errors, return
  if (errors.length) {
    return res.status(400).json({ errors });
  }

  const starterChunk = "INSERT INTO OrderPost_warehouses";
  // initialize with "required" props
  const columns = [
    "user_id",
    "first_name",
    "last_name",
    "nick_name",
    "phone",
    "address_line1",
    "city_locality",
    "state_province",
    "postal_code",
    "country_code",
  ];
  const values = [
    userId,
    first_name,
    last_name,
    nick_name,
    phone,
    address_line1,
    city_locality,
    state_province,
    postal_code,
    country_code,
  ];
  // missing: email, company_name, address_line2, address_line3, address_residential_indicator
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
    address_residential_indicator &&
    typeof address_residential_indicator === "boolean"
  ) {
    columns.push("address_residential_indicator");
    values.push(address_residential_indicator);
  }
  const valuesLength = new Array(values.length).fill("?");
  let sql = `${starterChunk} (${columns.join(
    ", "
  )}) VALUES (${valuesLength.join(", ")})`;
  // prettier did a gross thing there
  console.log(sql);

  // use async pattern to retrieve warehouse by ID here
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
  // if here, INSERT was successful
  getWarehouseById(
    {
      userInfo: {
        userId: userId,
      },
      params: {
        warehouseId: updatedResults.insertId,
      },
    },
    // (getWarehouseById still needs access to createWarehouse's res parameter)
    res
    // the response from getWarehouseById becomes the response of createWarehouse
  );
};

const deleteWarehouse = (req, res) => {
  const userId = req.userInfo.userId;
  const warehouseId = +req.params.warehouseId;
  const errors = [];

  const checkNaN = isNaN(warehouseId);

  if (checkNaN) {
    errors.push({
      status: "error",
      message: "warehouseId is not a number",
      code: 400,
    });
  }
  if (errors.length) {
    return res.status(400).json({ errors });
  }

  let sql =
    "DELETE FROM OrderPost_warehouses WHERE warehouse_id = ? AND user_id = ?";

  const params = [warehouseId, userId];
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
          message: "invalid warehouse_id",
          code: 400,
        },
      });
    } else {
      res.json({ message: "warehouse deleted successfully" });
    }
  });
};

module.exports = {
  listWarehouses,
  getWarehouseById,
  verifyWarehouse,
  createWarehouse,
  deleteWarehouse,
};
