# Student Details and Photo Upload Project

## Overview

This project is a MERN stack application that allows for the submission of student details along with a photo of the student ID card. The application integrates with Google Drive to handle photo uploads, provides a preview link for uploaded images, and manages API throttling using a cron job for delayed uploads.

## Features

* **Student Details Form**: Collects student information through a user-friendly form.
* **Photo Upload**: Allows users to upload a photo of their student ID card.
* **Google Drive Integration**: Uploads the ID card photo to a designated folder in Google Drive and generates a URL for the image.
* **Preview Link**: Displays a preview link for the uploaded image.
* **API Throttling Handling**: Manages API rate limits by temporarily storing files in a separate folder and using a cron job to move them to the final destination at midnight.

## Getting Started

### Prerequisites

* Node.js
* MongoDB
* Google Drive API credentials

### Installation

1. **Clone the Repository**  
   Clone the repository from GitHub and navigate into the project directory.

2. **Install Dependencies**  
   Install the necessary dependencies for both the frontend and backend.

3. **Set Up Environment Variables**  
   Create a `.env` file in the root directory and add the following environment variables:
   * `PORT` - The port number for the server (e.g., `3001`).
   * `DB_URL` - The URL for your MongoDB database.
   * `JWTPRIVATEKEY` - Your JWT private key.
   * `SALT` - The salt value for hashing (e.g., `10`).
   * `TEMP_FOLDER_ID` - The Google Drive folder ID for temporarily storing files.
   * `PERMANENT_FOLDER_ID` - The Google Drive folder ID for storing files permanently.

4. **Set Up Google Drive API**  
   Follow the [Google Drive API documentation](https://developers.google.com/drive/api/v3/quickstart/nodejs) to set up your credentials and enable the API.

### Running the Application

1. **Start the Backend Server**  
   Navigate to the backend directory and start the server.

2. **Start the Frontend**  
   Navigate to the frontend directory and start the application.

### Cron Job Setup

To handle API throttling, the application uses a cron job to manage delayed file uploads. Install the `node-cron` package and configure the cron job to run at midnight to move files from the temporary folder to the permanent folder.

1. **Install Node-Cron**  
   Install the `node-cron` package.

2. **Configure Cron Job**  
   In your backend code, set up a cron job to move files from the temporary folder to the permanent folder at midnight.

### API Endpoints

* **POST /upload**: Endpoint for uploading student details and the photo.
* **GET /getUsers**: Endpoint for retrieving the data in the database.

### Error Handling

* **API Throttling**: If the Google Drive API is throttled, files are temporarily stored in a specified folder. A cron job will handle moving these files to the intended location.
* **File Upload Issues**: If there are issues with file uploads, the application will notify users and attempt to retry the upload.

