const express = require("express");

const customersControllers = require("../controllers/customersController");

const router = express.Router();

const auths = require("../middleware/auth");

router.get("/", auths.checkJWT, customersControllers.listCustomers);

router.get(
  "/:customerId",
  auths.checkJWT,
  customersControllers.getCustomerById
);

router.post("/", auths.checkJWT, customersControllers.createCustomer);

router.patch(
  "/:customerId",
  auths.checkJWT,
  customersControllers.updateCustomer
);

router.delete(
  "/:customerId",
  auths.checkJWT,
  customersControllers.deleteCustomer
);

module.exports = router;
