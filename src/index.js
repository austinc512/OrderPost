const express = require("express");
require("dotenv").config();
// const usersRouter = require("./routers/users");
// console.log(process.env);

const app = express();

// const port = process.env.EXPRESS_PORT;
const port = process.env.EXP_PORT || 5001;

app.use(express.json());

/*
Structure:

in main.js:
let yourRoute - require("./routes/yourRoute");
app.use("/", yourRoute);

Inside of routes file:
const express = require("express");

const authControllers = require("../controllers/authController");

const auths = require("../middleware/auth");

const router = express.Router();

router.post("/register", authControllers.registerUser);

module.exports = router;

Notes for implementing auth:

After implementing authentication, this changes the structure of the router.get method call in the Routes file

IMPORTANT IMPORTANT IMPORTANT IMPORTANT
router.get("/privateHello", auths.checkJWT, messageControllers.privateHello);

inside of checkJWT function in auths middleware file, you need the next() function at the end
let checkJWT = (req, res, next) => {
    // logic here
      next();
};
module.exports = { checkJWT };

That adds authentication to these router.get calls
for now, only implementing routes, no auth. just know for later

*/

// already on the products endpoint
const productRoutes = require("./routes/productRoutes");
app.use("/products", productRoutes);

// use customers endpoint
const customerRoutes = require("./routes/customerRoutes");
app.use("/customers", customerRoutes);

const authRoutes = require("./routes/authRoutes");
app.use("/auth", authRoutes);

const warehouseRoutes = require("./routes/warehouseRoutes");
app.use("/warehouses", warehouseRoutes);

const orderRoutes = require("./routes/ordersRoutes");
app.use("/orders", orderRoutes);

const shipmentRoutes = require("./routes/shipmentsRoutes");
app.use("/shipments", shipmentRoutes);

// testing
app.use("/", (req, res) => {
  res.json({ message: "welcome to my server!" });
});

app.listen(port, () => {
  console.log(`Web server is listening on port ${port}!`);
});