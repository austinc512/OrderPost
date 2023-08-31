const express = require("express");

const shipmentsController = require("../controllers/shipmentsController");

const router = express.Router();

const auths = require("../middleware/auth");

router.get("/", auths.checkJWT, shipmentsController.listShipments);

router.get("/:shipmentId", auths.checkJWT, shipmentsController.listShipments);

router.delete(
  "/:shipmentId",
  auths.checkJWT,
  shipmentsController.deleteShipment
);

module.exports = router;
