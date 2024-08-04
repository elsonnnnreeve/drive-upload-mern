require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const stream = require('stream');
const { google } = require('googleapis');
const UserModel = require('../models/Users');
const cron = require('node-cron');

const router = express.Router();
const upload = multer();

router.use(cors());

const KEYFILEPATH = path.join(__dirname, "../cred1.json");
const SCOPES = ["https://www.googleapis.com/auth/drive"];
const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES,
});
const drive = google.drive({ version: "v3", auth });

const getDriveStorageInfo = async () => {
    try {
        const response = await drive.about.get({ fields: "storageQuota" });
        return response.data.storageQuota;
    } catch (error) {
        console.error("Error fetching Drive storage information:", error.message);
        throw new Error("Unable to fetch Drive storage information.");
    }
};

const uploadFile = async (fileObject, isTemporary = false) => {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileObject.buffer);

    try {
        const storageInfo = await getDriveStorageInfo();
        const { limit, usage } = storageInfo;

        const limitBytes = parseInt(limit, 10);
        const usageBytes = parseInt(usage, 10);
        const remainingSpace = limitBytes - usageBytes;

        if (fileObject.size > remainingSpace) {
            if (isTemporary) {
                throw new Error("Insufficient storage quota on Google Drive. Unable to upload file.");
            } else {
                const { data } = await drive.files.create({
                    media: {
                        mimeType: fileObject.mimetype,
                        body: bufferStream,
                    },
                    requestBody: {
                        name: fileObject.originalname,
                        parents: [process.env.TEMP], //temp folder
                    },
                    fields: "id, name",
                });

                return `https://drive.google.com/file/d/${data.id}/view?usp=sharing`;
            }
        }

     
        const { data } = await drive.files.create({
            media: {
                mimeType: fileObject.mimetype,
                body: bufferStream,
            },
            requestBody: {
                name: fileObject.originalname,
                parents: [process.env.OG], //original folder
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


const moveFilesFromTempToOriginal = async () => {
    try {
       
        const folderId = process.env.TEMP; 
        const response = await drive.files.list({
            q: `'${folderId}' in parents`, 
            fields: 'files(id, name)',
        });
        

        const files = response.data.files;

        for (const file of files) {
            
            await drive.files.update({
                fileId: file.id,
                addParents: process.env.OG,
                removeParents: process.env.TEMP,
            });

            
            const fileUrl = `https://drive.google.com/file/d/${file.id}/view?usp=sharing`;
            await UserModel.updateOne(
                { id: `https://drive.google.com/file/d/${file.id}/view?usp=sharing` }, //temp url
                { $set: { id: fileUrl } }
            );
        }
    } catch (error) {
        console.error("Error moving files from temporary to original folder:", error.message);
    }
};

//cron job at 2 am
cron.schedule('0 2 * * *', () => {
    console.log('Running cron job to move files from temporary to original folder.');
    moveFilesFromTempToOriginal();
});


router.post("/upload", upload.single('file'), async (req, res) => {
    try {
        const { name, age, gender } = req.body;
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: "File not provided" });
        }

        const fileUrl = await uploadFile(file, false);

        const newUser = new UserModel({ name, age, gender, id: fileUrl });
        await newUser.save();

        res.status(200).json({ name, age, gender, id: fileUrl });
    } catch (err) {
        if (err.message.includes("Insufficient storage quota")) {
            res.status(413).json({ error: "File size exceeds storage limit." });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

module.exports = router;
