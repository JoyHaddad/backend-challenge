const express = require("express");
const bcrypt = require("bcrypt");

const app = express();
const port = 8000;

const db = require("./models");
const jwt = require("jsonwebtoken");

db.User.hasMany(db.Post);
db.Post.belongsTo(db.User);

const { Sequelize } = require("sequelize");
const controller = require("./controller/file.controller");
app.post("/v1/createPost", controller.createPost);

const sequelize = new Sequelize("backenddb", "postgres", "scott325", {
  host: "localhost",
  dialect: "postgres",
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");

    // Signup route
    app.post("/v1/signup", async (req, res) => {
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
    app.post("/v1/login", async (req, res) => {
      const { email, password } = req.query;
      if (!email || !password) {
        res.status(400).send("Missing required parameters");
        return;
      }
      try {
        const token = await authenticateUser(email, password);
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

    // Create Post post route
    exports.createPost = async (req, res) => {
      const { description, image: imageUrl } = req.query; // Assuming image should be imageUrl
      if (!description || !imageUrl) {
        res.status(400).send("Missing required parameters");
        return;
      }
      const token = req.headers.authorization;
      if (!token) {
        res.status(401).send("Unauthorized");
        return;
      }

      const tokenWithoutBearer = token.replace("Bearer ", "");
      try {
        const decoded = jwt.verify(tokenWithoutBearer, "secretKey");
        const user = await db.User.findByPk(decoded.id);
        if (!user) {
          res.status(401).send("Unauthorized");
          return;
        }

        await user.createPost({
          description,
          imageUrl,
        });
        res.send("Post created successfully");
      } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).send("Error creating post");
      }
    };

    db.sequelize.sync().then(() => {
      app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
      });
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
})();

// Your logic to authenticate the user with the provided email and password
const authenticateUser = async (email, password) => {
  try {
    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      return false;
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return false;
    }
    const token = jwt.sign({ id: user.id }, "secretKey", {
      expiresIn: "1h",
    });
    return token;
  } catch (error) {
    console.error("Error during user authentication:", error);
    throw error;
  }
};
