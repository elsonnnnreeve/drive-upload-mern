require('dotenv').config();
const express = require("express");
const app = express();
const UserModel = require("./models/Users");
app.use(express.json());
const mongoose = require("mongoose");
mongoose.set('strictQuery', true);
const cors = require("cors");
app.use(cors({
 origin:["https://deploy-mern1whq.vercel.app"],
    methods:["POST","GET"],
    credentials:true
}));

const stream = require("stream");
const multer = require("multer");
const path = require("path");
const { google } = require("googleapis");
const upload = multer();

app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.DB)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.log("Cannot connect to MongoDB.", err));

const KEYFILEPATH = path.join(__dirname, "cred1.json");
const SCOPES = ["https://www.googleapis.com/auth/drive"];

const getDriveStorageInfo = async () => {
    const auth = new google.auth.GoogleAuth({
        keyFile: KEYFILEPATH,
        scopes: SCOPES,
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
        const { limit,usageInDrive,usageInDriveTrash,usage } = storageInfo;
//limit gives total available storage and usage gives used storage.
        const limitBytes = parseInt(limit, 10);
        const usageBytes = parseInt(usage, 10);

        const remainingSpace = limitBytes - usageBytes;

        console.log("Remaining storage (bytes):", remainingSpace);
        console.log("Limit (bytes):", limitBytes);
        console.log("Usage (bytes):", usageBytes);
        console.log("usageInDriveTrash",usageInDriveTrash);
        console.log("usageInDrive:", usageInDrive);
        console.log("File size (bytes):", fileObject.size);

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
                parents: ["1DVAE4fQ8_u5MC6Du2kmoSrl3oy_GZzlD"], // the folder link id
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

        const fileUrl = await uploadFile(file);

        const newUser = new UserModel({ name, age, gender, id: fileUrl });
        await newUser.save();

        res.status(200).json({ name, age, gender, id: fileUrl });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/getUsers",(req,res)=>{
    UserModel.find({},(err,result)=>{
        if(err){
            res.json(err);
        }else{
            res.json(result);
        }
    })
})

app.listen(process.env.PORT,'0.0.0.0', () => {//by default only localhost so change it.
    console.log(`Listening on port ${process.env.PORT}...`);
});
