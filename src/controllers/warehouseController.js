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
  // validate address
  const response = await validateAddress(req);
  const userId = req.userInfo.userId;
  // store address in database

  /*
    do thing here
  */

  // return address
  res.json(response);
};

const createWarehouse = async (req, res) => {
  // validate address
  const response = await validateAddress(req);
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
