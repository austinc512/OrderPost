const express = require("express");

const productControllers = require("../controllers/productController");

const router = express.Router();

// would need to require auths middleware here
// then use 3 parameters inside router.get or .post etc. method calls

module.exports = router;
