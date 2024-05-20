const db = require("./user");

module.exports = (sequelize, DataTypes) => {
  const Friend = sequelize.define("Friend", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId1: {
      type: DataTypes.INTEGER,
      references: {
        model: db.User,
        key: "id",
      },
    },
    userId2: {
      type: DataTypes.INTEGER,
      references: {
        model: db.User,
        key: "id",
      },
    },
  });
  return Friend;
};
