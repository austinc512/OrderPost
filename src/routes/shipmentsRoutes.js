const express = require("express");

const shipmentsController = require("../controllers/shipmentsController");

const router = express.Router();

const auths = require("../middleware/auth");

router.get("/", auths.checkJWT, shipmentsController.listShipments);

router.get(
  "/:orderId",
  auths.checkJWT,
  shipmentsController.getShipmentByOrderId
);

router.delete(
  "/:orderId",
  auths.checkJWT,
  shipmentsController.deleteShipmentByOrderId
);

module.exports = router;
