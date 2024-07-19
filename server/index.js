require('dotenv').config();
const express = require("express");
const app = express();
const UserModel = require("./models/Users");
const mongoose = require("mongoose");
const cors = require("cors");
const stream = require("stream");
const multer = require("multer");
const path = require("path");
const { google } = require("googleapis");
const rateLimit = require("express-rate-limit"); // Import express-rate-limit

app.use(express.json());
app.use(cors(
    {
        origin: ["https://drive-upload-client.vercel.app"],
        methods: ["POST", "GET"],
        credentials: true
    }
));
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.DB)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.log("Cannot connect to MongoDB.", err));

mongoose.set('strictQuery', true);

const KEYFILEPATH = path.join(__dirname, "cred1.json");
const SCOPES = ["https://www.googleapis.com/auth/drive"];
const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES,
});
const drive = google.drive({ version: "v3", auth });
const upload = multer();

//rate limiting middleware
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, //limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again after 15 minutes"
});

app.use(apiLimiter);

const getDriveStorageInfo = async () => {
    try {
        const response = await drive.about.get({ fields: "storageQuota" });
        return response.data.storageQuota;
    } catch (error) {
        console.error("Error fetching Drive storage information:", error.message);
        throw new Error("Unable to fetch Drive storage information.");
    }
};


const uploadFile = async (fileObject) => {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileObject.buffer);

    try {
        const storageInfo = await getDriveStorageInfo();
        const { limit, usage } = storageInfo;
        const limitBytes = parseInt(limit, 10);
        const usageBytes = parseInt(usage, 10);
        const remainingSpace = limitBytes - usageBytes;
        console.log("remaining space:",remainingSpace);
        console.log("limit:",limit);
        console.log("usage:",usage);
        console.log("File",fileObject.size);

        if (fileObject.size > remainingSpace) {
            throw new Error("Insufficient storage quota on Google Drive. Unable to upload file.");
        }

        const { data } = await drive.files.create({
            media: {
                mimeType: fileObject.mimetype,
                body: bufferStream,
            },
            requestBody: {
                name: fileObject.originalname,
                parents: ["1DVAE4fQ8_u5MC6Du2kmoSrl3oy_GZzlD"], // Folder ID
            },
            fields: "id, name",
        });
        const fileUrl = `https://drive.google.com/file/d/${data.id}/view?usp=sharing`;
        return fileUrl;
    } catch (error) {
        console.error("Error uploading file to Drive:", error.message);
        throw error;
    }
};

//file upload endpoint
app.post("/upload", upload.single('file'), async (req, res) => {
    try {
        const { name, age, gender } = req.body;
        const file = req.file;
        const fileUrl = await uploadFile(file);

        const newUser = new UserModel({ name, age, gender, id: fileUrl });
        await newUser.save();

        res.status(200).json({ name, age, gender, id: fileUrl });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//get users endpoint
app.get("/getUsers", (req, res) => {
    UserModel.find({}, (err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

//error handling for unhandled routes
app.use((req, res, next) => {
    res.status(404).json({ error: "Not found" });
});

//error handler middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Internal server error" });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});