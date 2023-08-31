const db = require("../sql/db");

const listShipments = (req, res) => {
  // creating scaffolding
  // will implement later
  // this one will take at least a size query param
  /*
      - GET /shipments - return an array of shipments (default size = 100)
      - GET /shipments?size={size} - query param allowing you to change the size returned (max size = 500).
    */
  res.json(`Coming Soon!`);
};

const getShipmentById = (req, res) => {
  // creating scaffolding
  // will implement later
  res.json(`Coming Soon!`);
};

const deleteShipment = (req, res) => {
  // creating scaffolding
  // will implement later
  res.json(`Coming Soon!`);
};

module.exports = {
  listShipments,
  getShipmentById,
  deleteShipment,
};
