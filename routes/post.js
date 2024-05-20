const express = require("express");
require("dotenv").config();
const router = express.Router();

const userAuth = require("../middleware/userAuth");

const db = require("../models");

db.User.hasMany(db.Post);
db.Post.belongsTo(db.User);

const { Storage } = require("@google-cloud/storage");
const storage = new Storage({ keyFilename: "google-cloud-key.json" });
const bucketName = process.env.BUCKET_NAME;

const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const moment = require("moment");

router.post("/", userAuth, upload.array("images", 5), async (req, res) => {
  const { description } = req.query;
  const files = req.files;

  if (!description || !files || files.length === 0) {
    res.status(400).send("Missing required parameters");
    return;
  }

  try {
    const imageUrls = [];
    // Upload files to Google Cloud Storage
    for (const file of files) {
      const blob = storage
        .bucket(bucketName)
        .file(Date.now().toString() + "-" + file.originalname);
      const blobStream = blob.createWriteStream({
        resumable: false,
        contentType: file.mimetype,
      });

      blobStream.on("error", (err) => {
        console.error("Error uploading to GCS:", err);
        res.status(500).send("Error uploading files");
      });

      const user = await db.User.findByPk(req.userId);
      blobStream.on("finish", () => {
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${blob.name}`;
        imageUrls.push(publicUrl);

        // Check if all files have been uploaded
        if (imageUrls.length === files.length) {
          user
            .createPost({
              description,
              images: imageUrls.join(","), // Store image URLs in the database as a comma-separated string
            })
            .then(() => {
              res.send("Post created successfully");
            })
            .catch((error) => {
              console.error("Error creating post:", error);
              res.status(500).send("Error creating post");
            });
        }
      });
      blobStream.end(file.buffer);
    }
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).send("Error creating post");
  }
});

router.get("/posts", async (req, res) => {
  try {
    const posts = await db.Post.findAll({
      include: [
        {
          model: db.User,
          attributes: ["username"], // Assuming you want to include the username of the poster
        },
      ],
      attributes: ["id", "description", "createdAt"], // Specify only the necessary attributes
      order: [["createdAt", "DESC"]], // Order by date in descending order
    });

    const results = posts.map((post) => ({
      id: post.id,
      description: post.description,
      postedTime: moment(post.createdAt).fromNow(), // Format createdAt to a relative time
      username: post.User.username, // Include username from the User association
    }));

    res.json(results);
  } catch (error) {
    console.error("Error retrieving posts:", error);
    res.status(500).send("Error retrieving posts");
  }
});

//edit description
router.patch("/:postId", userAuth, async (req, res) => {
  const { description } = req.query;
  const { postId } = req.params;

  if (!description) {
    res.status(400).send("Description is required");
    return;
  }

  try {
    const post = await db.Post.findByPk(postId);

    if (!post) {
      res.status(404).send("Post not found");
      return;
    }

    // Check if the authenticated user is the owner of the post
    if (post.UserId !== req.userId) {
      res.status(403).send("Unauthorized to edit this post");
      return;
    }

    post.description = description;
    await post.save();

    res.send("Post description updated successfully");
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).send("Error updating post");
  }
});

module.exports = router;
