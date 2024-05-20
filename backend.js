const express = require("express");
require("dotenv").config();

const app = express();
const port = 8000;

const userRoute = require("./routes/user");
const postRoute = require("./routes/post");
const friendRoute = require("./routes/friend");

const db = require("./models");

const { Sequelize } = require("sequelize");
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.PSQL_USER,
  process.env.PSQL_PASS,
  {
    host: "localhost",
    dialect: "postgres",
  }
);

(async () => {
  try {
    await sequelize.authenticate();
    console.log("DB Connection Successfull");

    app.use("/user", userRoute);
    app.use("/post", postRoute);
    app.use("/friend", friendRoute);

    db.sequelize.sync().then(() => {
      app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
      });
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
})();
