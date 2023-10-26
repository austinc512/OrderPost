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

// customers endpoint also controls /customers/:customerId/addresses
// i.e. ship-to addresses for each customer

router.get(
  "/:customerId/addresses",
  auths.checkJWT,
  customersControllers.getCustomerAddresses
);

router.post(
  "/:customerId/addresses/verify",
  auths.checkJWT,
  customersControllers.verifyCustomerAddress
);

router.post(
  "/:customerId/addresses",
  auths.checkJWT,
  customersControllers.createCustomerAddress
);

router.get(
  "/:customerId/addresses/:addressId",
  auths.checkJWT,
  customersControllers.getAddressById
);

router.patch(
  "/:customerId/addresses/:addressId",
  auths.checkJWT,
  customersControllers.updateAddressById
);

router.delete(
  "/:customerId/addresses/:addressId",
  auths.checkJWT,
  customersControllers.deleteAddressById
);

module.exports = router;
