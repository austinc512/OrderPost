const db = require("../sql/db");
const { validateAddress } = require("../utils/shipEngineAPI");

const listWarehouses = (req, res) => {
  // creating scaffolding
  // will implement later
  res.json(`Coming Soon!`);
};

const getWarehouseById = (req, res) => {
  // creating scaffolding
  // will implement later
  res.json(`Coming Soon!`);
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
  // it gives the user a chance to manually edit address returned from ShipEngine.
  const userId = req.userInfo.userId;
  // store address in database

  /*
    do thing here
  */

  // return address
  res.json(response);
};

const deleteWarehouse = (req, res) => {
  // creating scaffolding
  // will implement later
  res.json(`Coming Soon!`);
};

module.exports = {
  listWarehouses,
  getWarehouseById,
  verifyWarehouse,
  createWarehouse,
  deleteWarehouse,
};
