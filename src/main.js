const express = require("express");
require("dotenv").config();
// const usersRouter = require("./routers/users");
// console.log(process.env);

const app = express();

// const port = process.env.EXPRESS_PORT;
const port = process.env.EXP_PORT || 5001;

app.use(express.json());
