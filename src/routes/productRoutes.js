const express = require("express");

const productControllers = require("../controllers/productController");

const router = express.Router();

const auths = require("../middleware/auth");

// GET /products
// and GET /products?size={size}
router.get("/", auths.checkJWT, productControllers.listProducts);

// GET /products/:id
router.get("/:productId", auths.checkJWT, productControllers.getProductById);

// POST /products
router.post("/", auths.checkJWT, productControllers.createProduct);

// would need to require auths middleware here
// then use 3 parameters inside router.get or .post etc. method calls

// PUT or PATCH /products/:productId
// want to work on this last
router.patch("/:productId", auths.checkJWT, productControllers.updateProduct);

router.delete("/:productId", auths.checkJWT, productControllers.deleteProduct);

module.exports = router;
