const db = require("../sql/db");

const listOrders = (req, res) => {
  // creating scaffolding
  // will implement later
  // this one will take at least a size query param
  /*
    - GET /orders - return an array of orders (default size = 100)
    - GET /orders?size={size} - query param allowing you to change the size returned (max size = 500).
  */
  res.json(`Coming Soon!`);
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
