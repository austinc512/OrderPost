const express = require("express");

const ordersController = require("../controllers/ordersController");

const router = express.Router();

const auths = require("../middleware/auth");

router.get("/", auths.checkJWT, ordersController.listOrders);

router.get("/:orderId", auths.checkJWT, ordersController.getOrderById);

router.post("/", auths.checkJWT, ordersController.createOrder);

router.patch("/:orderId", auths.checkJWT, ordersController.updateOrder);

// adding orderItems routes

router.get(
  "/:orderId/order-items",
  auths.checkJWT,
  ordersController.getOrderItems
);

router.post(
  "/:orderId/order-items",
  auths.checkJWT,
  ordersController.addOrderItem
);

router.patch(
  "/:orderId/order-items",
  auths.checkJWT,
  ordersController.updateOrderItem
);

router.delete(
  "/:orderId/order-items",
  auths.checkJWT,
  ordersController.deleteOrderItem
);

// Shipments are generated from Orders, so that path also lives here
router.post(
  "/:orderId/create-shipment",
  auths.checkJWT,
  ordersController.createShipment
);

// Rates
router.post("/rates", auths.checkJWT, ordersController.getRates);

module.exports = router;
