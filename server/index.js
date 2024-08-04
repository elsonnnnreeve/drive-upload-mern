require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const getRoutes = require('./api/gg');
const postRoutes = require('./api/pp');

const app = express();


app.use(express.json());
app.use(cors());

//rate limiting middleware
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again after 15 minutes"
});
app.use('/api', apiLimiter);


app.use('/api', getRoutes);
app.use('/api', postRoutes);


mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.log("Cannot connect to MongoDB.", err));

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
