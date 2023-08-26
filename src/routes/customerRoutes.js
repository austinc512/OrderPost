const express = require("express");

const customersControllers = require("../controllers/customersController");

const router = express.Router();

router.get("/", customersControllers.listCustomers);

router.get("/:customerId", customersControllers.getCustomerById);

router.post("/", customersControllers.createCustomer);

router.patch("/:customerId", customersControllers.updateCustomer);

module.exports = router;
