require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const getRoutes = require('./api/gg');
const postRoutes = require('./api/pp');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Rate limiting middleware
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again after 15 minutes"
});
app.use('/api', apiLimiter);

// Use routes
app.use('/api', getRoutes);
app.use('/api', postRoutes);

// MongoDB connection
mongoose.connect("mongodb+srv://elsonnnnreeve:nothing@space.o2x3jla.mongodb.net/ISP2?retryWrites=true&w=majority&appName=space", { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.log("Cannot connect to MongoDB.", err));

// Start server
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
