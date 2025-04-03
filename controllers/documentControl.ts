import { google } from "googleapis";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// Authenticate with Google Drive API
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URL
);

// oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

const drive = google.drive({ version: "v3", auth: oauth2Client });

/**
 * Check if a folder exists for the user; if not, create one.
 * @param {string} username
 * @returns {Promise<string>} Folder ID
 */
export const getOrCreateUserFolder = async (
  username: string
): Promise<string> => {
  try {
    // Check if folder exists
    const response = await drive.files.list({
      q: `name='${username}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id, name)",
    });

    if (response.data.files.length > 0) {
      return response.data.files[0].id;
    }

    // Create new folder
    const folder = await drive.files.create({
      requestBody: {
        name: username,
        mimeType: "application/vnd.google-apps.folder",
      },
      fields: "id",
    });

    return folder.data.id;
  } catch (error) {
    console.error("Error creating/finding folder:", error);
    throw error;
  }
};

/**
 * Uploads a file to Google Drive inside the user-specific folder.
 * @param {string} folderId
 * @param {Express.Multer.File} file
 * @returns {Promise<string>} File ID
 */
export const uploadFileToDrive = async (
  folderId: string,
  file: Express.Multer.File
): Promise<string> => {
  try {
    const response = await drive.files.create({
      requestBody: {
        name: file.originalname,
        parents: [folderId],
      },
      media: {
        mimeType: file.mimetype,
        body: fs.createReadStream(file.path),
      },
      fields: "id, webViewLink",
    });

    return response.data.webViewLink;
  } catch (error) {
    console.error("Error uploading file to Drive:", error);
    throw error;
  }
};
