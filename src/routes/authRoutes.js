const express = require("express");

const authControllers = require("../controllers/authController");

const router = express.Router();

router.post("/register", authControllers.registerUser);

router.post("/login", authControllers.login);

module.exports = router;
