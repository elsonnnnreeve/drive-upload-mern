require('dotenv').config();
const express = require("express");
const app = express();
const UserModel = require("./models/Users");
app.use(express.json());
const mongoose = require("mongoose");
mongoose.set('strictQuery', true);
const cors = require("cors");
app.use(cors());

// Start Google Drive and multer setup
const stream = require("stream");
const multer = require("multer");
const path = require("path");
const { google } = require("googleapis");
const upload = multer();

app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect(process.env.DB)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.log("Cannot connect to MongoDB.", err));

    const getDriveStorageInfo = async () => {
        const auth = new google.auth.GoogleAuth({
            keyFile: KEYFILEPATH,
            scopes: ["https://www.googleapis.com/auth/drive"],
        });
        const drive = google.drive({ version: "v3", auth });
    
        try {
            const response = await drive.about.get({
                fields: "storageQuota",
            });
            return response.data.storageQuota;
        } catch (error) {
            console.error("Error fetching Drive storage information:", error.message);
            throw new Error("Unable to fetch Drive storage information.");
        }
    };
    

// Google Drive authentication setup
const KEYFILEPATH = path.join(__dirname, "cred.json");
const SCOPES = ["https://www.googleapis.com/auth/drive"];

const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES,
});

const drive = google.drive({ version: "v3", auth });

const uploadFile = async (fileObject) => {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileObject.buffer);

    try {
        
        const storageInfo = await getDriveStorageInfo();
        const { limit, usage } = storageInfo;

        const remainingSpace = limit - usage;
        console.log("stpragwe:",usage);

        
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
                parents: ["1DVAE4fQ8_u5MC6Du2kmoSrl3oy_GZzlD"],//the key
            },
            fields: "id, name",
        });
        const fileUrl = `https://drive.google.com/file/d/${data.id}/view?usp=sharing`;
        console.log(`Uploaded file ${data.name} (${data.id}). URL: ${fileUrl}`);
        return fileUrl;
    } catch (error) {
        console.error("Error uploading file to Drive:", error.message);
        throw error;
    }
};

app.post("/upload", upload.single('file'), async (req, res) => {
    try {
        const { name, age, gender } = req.body;
        const file = req.file;

        //upload
        const fileUrl = await uploadFile(file);

    
        const newUser = new UserModel({ name, age, gender, id: fileUrl });
        await newUser.save();

        res.status(200).json({ message: "Successfully uploaded to Drive and backend", fileUrl });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.listen(process.env.PORT, () => {
    console.log(`Listening on port ${process.env.PORT}...`);
});
