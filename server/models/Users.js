const mongoose = require("mongoose"); 

const UserSchema = new mongoose.Schema({ 
    name: {
        type: String,
        required: true,
    },
    age: {
        type: Number,
        required: true,
    },
    gender: {
        type: String,
        enum: ["m", "f", "o"],
        required: true,
    },
    id: {
        type: String,
        required: true,
        //unique: true 
        // Assuming each user ID should be unique
    },
});

const UserModel = mongoose.model("users", UserSchema); // Model name typically singular and capitalized
module.exports = UserModel;
