const express = require("express");
const router = express.Router();

const db = require("../models");
const { Sequelize } = require("sequelize");

const userAuth = require("../middleware/userAuth");

db.User.belongsToMany(db.User, {
  through: db.Friend,
  as: "Friends",
  foreignKey: "userId1",
  otherKey: "userId2",
});

db.User.belongsToMany(db.User, {
  through: db.Friend,
  as: "FriendsReverse",
  foreignKey: "userId2",
  otherKey: "userId1",
});

// post request to add friend
router.post("/add", userAuth, async (req, res) => {
  const requesterId = req.userId; // userAuth middleware sets req.userId
  const { friendId } = req.query;

  if (!friendId) {
    return res.status(400).send("Friend ID is required");
  }
  console.log(requesterId, friendId);
  if (parseInt(requesterId) === parseInt(friendId)) {
    return res.status(400).send("Cannot add yourself as a friend");
  }

  try {
    // Check if friend users exist
    const userExists = await db.User.findByPk(friendId);

    if (!userExists) {
      return res.status(404).send("User not found");
    }

    // Check if friendship already exists
    const friendshipExists = await db.Friend.findOne({
      where: {
        [Sequelize.Op.or]: [
          { userId1: requesterId, userId2: friendId },
          { userId1: friendId, userId2: requesterId },
        ],
      },
    });

    if (friendshipExists) {
      return res.status(409).send("Friendship already exists");
    }

    // Add friendship (assuming symmetric relationship)
    await db.Friend.create({ userId1: requesterId, userId2: friendId });

    res.send("Friend added successfully");
  } catch (error) {
    console.error("Error adding friend:", error);
    res.status(500).send("Error processing friend request");
  }
});

//get request to get list of friend info
router.get("/info", userAuth, async (req, res) => {
  const userId = req.userId; // The ID of the user making the request, set by userAuth middleware

  try {
    // Find all friendships involving the authenticated user
    const friendships = await db.Friend.findAll({
      where: {
        [Sequelize.Op.or]: [{ userId1: userId }, { userId2: userId }],
      },
    });

    // Extract friend IDs from the friendships
    const friendIds = friendships.map((friendship) => {
      return friendship.userId1 === userId
        ? friendship.userId2
        : friendship.userId1;
    });

    // Retrieve the information of all friends
    const friends = await db.User.findAll({
      where: {
        id: { [Sequelize.Op.in]: friendIds },
      },
    });

    // Format the response to return an array of friend information
    const friendInfo = await Promise.all(
      friends.map(async (friend) => {
        // Get all friends of the current friend
        const currentFriendFriends = await db.Friend.findAll({
          where: {
            [Sequelize.Op.or]: [{ userId1: friend.id }, { userId2: friend.id }],
          },
        });

        // Get the IDs of the current friend's friends
        const currentFriendFriendIds = currentFriendFriends.map((friendship) =>
          friendship.userId1 === friend.id
            ? friendship.userId2
            : friendship.userId1
        );

        // Filter to only include mutual friends
        const mutualFriends = currentFriendFriendIds.filter((id) =>
          friendIds.includes(id)
        );

        return {
          username: friend.username,
          email: friend.email,
          mutualFriends: mutualFriends.length, // Number of mutual friends
        };
      })
    );

    res.json(friendInfo);
  } catch (error) {
    console.error("Error retrieving friends' information:", error);
    res.status(500).send("Error processing request");
  }
});

module.exports = router;
