const express = require('express');
const cors = require('cors'); // Import the cors middleware
const UserModel = require("../models/Users");

const router = express.Router();

// CORS configuration
router.use(cors());

// Get users endpoint
router.get("/getUsers", (req, res) => {
    UserModel.find({}, (err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

module.exports = router;