const multer = require("multer");
const fs = require("fs");
const path = require("path");

const createUploader = ({
  folder = "common",
  prefix = "image",
  maxSizeMB = 5,
} = {}) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
     
      const uploadPath = path.join(
        __dirname,
        "../../uploads",
        folder
      );

      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      cb(null, uploadPath);
    },

    filename: (req, file, cb) => {
      const ext = file.mimetype.split("/")[1] || "png";
      const userId = req.user?._id || "guest";

      cb(
        null,
        `${prefix}-${userId}-${Date.now()}.${ext}`
      );
    },
  });

  const fileFilter = (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files allowed"), false);
    }
    cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
  });
};

const deleteFile = (filePath) => {
  if (!filePath) return;

  try {
    let relativePath = filePath;
    if (filePath.startsWith("http")) {
      const url = new URL(filePath);
      relativePath = url.pathname;
    }

    const cleanPath = relativePath.startsWith("/") ? relativePath.substring(1) : relativePath;
    const absolutePath = path.join(__dirname, "../../", cleanPath);

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      console.log(`Successfully deleted: ${absolutePath}`);
    }
  } catch (error) {
    console.error(`Error deleting file: ${filePath}`, error);
  }
};

module.exports = { createUploader, deleteFile };
