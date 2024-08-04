const express = require('express');
const cors = require('cors'); 
const UserModel = require("../models/Users");

const router = express.Router();

router.use(cors());

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