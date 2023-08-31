const express = require("express");

const warehouseControllers = require("../controllers/warehouseController");

const router = express.Router();

const auths = require("../middleware/auth");

// listWarehouses

router.get("/", auths.checkJWT, warehouseControllers.listWarehouses);

router.get(
  "/:warehouseId",
  auths.checkJWT,
  warehouseControllers.getWarehouseById
);

router.post("/", auths.checkJWT, warehouseControllers.createWarehouse);

router.patch(
  "/:warehouseId",
  auths.checkJWT,
  warehouseControllers.updateWarehouse
);

router.delete(
  "/:warehouseId",
  auths.checkJWT,
  warehouseControllers.deleteWarehouse
);

// warehouseControllers
module.exports = router;
