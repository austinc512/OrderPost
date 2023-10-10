const express = require("express");
require("dotenv").config();
// const usersRouter = require("./routers/users");
// console.log(process.env);

const app = express();

// const port = process.env.EXPRESS_PORT;
const port = process.env.EXP_PORT || 5001;

const productRoutes = require("./routes/productRoutes");
const customerRoutes = require("./routes/customerRoutes");
const authRoutes = require("./routes/authRoutes");
const warehouseRoutes = require("./routes/warehouseRoutes");
const orderRoutes = require("./routes/ordersRoutes");
const shipmentRoutes = require("./routes/shipmentsRoutes");

// need to add cors for cross origin
const cors = require("cors");

// const setHeader = (req, res, next) => {
//   // Website we wish to allow content
//   res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");

//   // Request methods you wish to allow
//   res.setHeader("Access-Control-Allow-Methods", "GET");

//   //type of content we wish to allow
//   res.setHeader(
//     "Access-Control-Allow-Headers",
//     "X-Requested-With,content-type"
//   );

//   // set to true if you need the website to include cookies in the request sent to the API (in case you use sessions)
//   res.setHeader("Access-Control-Allow-Credentials", true);

//   next();
// };

app.use(cors());

app.use(express.json());

app.use(function (req, res, next) {
  // Website we wish to allow content
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://order-post-client.vercel.app"
  );
  // res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");

  // Request methods you wish to allow
  res.setHeader("Access-Control-Allow-Methods", [
    "GET",
    "PATCH",
    "POST",
    "DELETE",
  ]);

  //type of content we wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );

  // set to true if you need the website to include cookies in the request sent to the API (in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);

  next();
});

// define the endpoint as the first argument to app.use
app.use("/products", productRoutes);
app.use("/customers", customerRoutes);
app.use("/auth", authRoutes);
app.use("/warehouses", warehouseRoutes);
app.use("/orders", orderRoutes);
app.use("/shipments", shipmentRoutes);

// testing
app.use("/", (req, res) => {
  res.json({ message: "welcome to my server! Running test." });
});

app.listen(port, () => {
  console.log(`Web server is listening on port ${port}!`);
});

module.exports = app;
