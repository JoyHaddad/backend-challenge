const bcrypt = require("bcrypt");
require("dotenv").config();

const jwt = require("jsonwebtoken");
const db = require("../models");

const userAuth = async (req, res, next) => {
  try {
    if (req.headers.authorization) {
      // If the request has an authorization header
      const tokenWithoutBearer = req.headers.authorization.replace(
        "Bearer ",
        ""
      );
      const decoded = jwt.verify(tokenWithoutBearer, process.env.JWT_KEY);
      const user = await db.User.findByPk(decoded.id);
      if (!user) {
        res.status(401).send("Unauthorized");
        return;
      }
      req.userId = decoded.id;
      next();
      return;
    }
    // If the request does not have an authorization header
    const { email, password } = req.query;
    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = jwt.sign({ id: user.id }, "secretKey", {
      expiresIn: "1h",
    });
    req.token = token;
    next();
    return;
  } catch (error) {
    console.error("Error during user authentication:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = userAuth;
