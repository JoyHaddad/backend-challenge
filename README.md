## Requirements for Setup

- Node.js
- PostgreSQL

## Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/JoyHaddad/backend-challenge.git
   cd backend-challenge
   npm i
   npx nodemon backend.js
   ```

2. **Run PostgreSQL Server**
3. **Setup PostgreSQL Config**

## Requirement 1 Implementation

- Created ER Diagram to map out relationships and their cardinality/participation contraints
- Created User and Post tables in models folder using sequelize
- Setup backend server in backend.js to run on port 8000
- Used nodemon dependency to apply changes more efficiently
- Set up posts requests to send login/signup credentials to database
- Verified required user credentials and disabled resuse of username or email when signing up
- Hashed passwords using bcrypt depenency to securely store passowrds in the database
- Returned JWT token when user logs in with valid username and password
- Created post request for user posts, using the bearer token to verify the user creating the post
- Sent userId as a foreign key to the posts create by their corresponding user
- Created GCP bucket in order to store images uploaded from the user's posts
- Generated a cloud key in json format to access the bucket
- Added middleware to process the images before uploading them to GCP
- Added file.controller to exports Rest APIs and upload the images

## ER Diagram for Backend Challenge

![backend-challenge](https://storage.googleapis.com/backend-challenge-bucket/Backend%20Challenge%20ER.jpg)
