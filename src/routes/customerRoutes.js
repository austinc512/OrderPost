const express = require("express");

const customersControllers = require("../controllers/customersController");

const router = express.Router();

router.get("/", customersControllers.listCustomers);

module.exports = router;
