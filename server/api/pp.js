const express = require('express');
const cors = require('cors'); // Import the cors middleware
const multer = require('multer');
const path = require('path');
const stream = require('stream');
const { google } = require('googleapis');
const UserModel = require('../models/Users');

const router = express.Router();
const upload = multer();

// CORS configuration
router.use(cors({
    origin: "https://drive-upload-frontend.vercel.app" // Update with your frontend URL
}));

// Drive API setup
const KEYFILEPATH = path.join(__dirname, "../cred1.json");
const SCOPES = ["https://www.googleapis.com/auth/drive"];
const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES,
});
const drive = google.drive({ version: "v3", auth });

// Function to get Drive storage info
const getDriveStorageInfo = async () => {
    try {
        const response = await drive.about.get({ fields: "storageQuota" });
        return response.data.storageQuota;
    } catch (error) {
        console.error("Error fetching Drive storage information:", error.message);
        throw new Error("Unable to fetch Drive storage information.");
    }
};

// Function to upload file to Drive
const uploadFile = async (fileObject) => {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileObject.buffer);

    try {
        const storageInfo = await getDriveStorageInfo();
        const { limit, usage } = storageInfo;

        const limitBytes = parseInt(limit, 10);
        const usageBytes = parseInt(usage, 10);
        const remainingSpace = limitBytes - usageBytes;

        console.log("limit: ",limit);
        console.log("usage: ",usage);
        console.log("Remaining space: ",remainingSpace);
        



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
                parents: ["1DVAE4fQ8_u5MC6Du2kmoSrl3oy_GZzlD"],
            },
            fields: "id, name",
        });

        await drive.permissions.create({
            fileId: data.id,
            requestBody: {
                type: 'anyone',
                role: 'reader',
                allowFileDiscovery: false,
            },
        });

        const fileUrl = `https://drive.google.com/file/d/${data.id}/view?usp=sharing`;
        console.log(`Uploaded file ${data.name} (${data.id}). URL: ${fileUrl}`);
        return fileUrl;
    } catch (error) {
        console.error("Error uploading file to Drive:", error.message);
        throw error;
    }
};

// File upload endpoint
router.post("/upload", upload.single('file'), async (req, res) => {
    try {
        const { name, age, gender } = req.body;
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: "File not provided" });
        }

        const fileUrl = await uploadFile(file);

        const newUser = new UserModel({ name, age, gender, id: fileUrl });
        await newUser.save();

        res.status(200).json({ name, age, gender, id: fileUrl });
    } catch (err) {
        console.error("Error processing request:", err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
