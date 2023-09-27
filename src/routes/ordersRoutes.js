const express = require("express");

const ordersController = require("../controllers/ordersController");

const router = express.Router();

const auths = require("../middleware/auth");

router.get("/", auths.checkJWT, ordersController.listOrders);

router.get("/:orderId", auths.checkJWT, ordersController.getOrderById);

router.post("/", auths.checkJWT, ordersController.createOrder);

router.patch("/:orderId", auths.checkJWT, ordersController.updateOrder);

// Shipments are generated from Orders, so that path also lives here
router.post(
  "/:orderId/createshipment",
  auths.checkJWT,
  ordersController.createShipment
);

module.exports = router;
