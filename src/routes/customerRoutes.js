const express = require("express");

const customersControllers = require("../controllers/customersController");

const router = express.Router();

router.get("/", customersControllers.listCustomers);

// GET /products/:id
router.get("/:customerId", customersControllers.getCustomerById);

module.exports = router;
