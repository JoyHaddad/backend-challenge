const express = require("express");
const router = express.Router();

const db = require("../models");
const bcrypt = require("bcrypt");

const { Sequelize } = require("sequelize");

const userAuth = require("../middleware/userAuth");

// Signup route
router.post("/signup", async (req, res) => {
  try {
    const { username, password, email } = req.query;

    if (!username || !password || !email) {
      return res.status(400).send("Missing required parameters");
    }

    const existingUser = await db.User.findOne({
      where: { [Sequelize.Op.or]: [{ username }, { email }] },
    });

    if (existingUser) {
      return res.status(400).send("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.User.create({ username, password: hashedPassword, email });
    res.send("User created successfully");
  } catch (error) {
    console.error("Error during sign up:", error);
    res.status(500).send("Error creating user");
  }
});

// Login route
router.post("/login", userAuth, async (req, res) => {
  const { email, password } = req.query;
  if (!email || !password) {
    res.status(400).send("Missing required parameters");
    return;
  }
  try {
    const token = req.token;
    if (!token) {
      res.status(401).send("Invalid email or password");
      return;
    }
    res.send({ token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send("Error logging in");
  }
});

module.exports = router;
