const express = require("express");

const productControllers = require("../controllers/productController");

const router = express.Router();

// GET /products
// and GET /products?size={size}
router.get("/", productControllers.listProducts);

// GET /products/:id
router.get("/:productId", productControllers.getProductById);

// POST /products
router.post("/", productControllers.createProduct);

// would need to require auths middleware here
// then use 3 parameters inside router.get or .post etc. method calls

// PUT or PATCH /products/:productId
// want to work on this last
router.patch("/:productId", productControllers.updateProduct);

router.delete("/:productId", productControllers.deleteProduct);

module.exports = router;
