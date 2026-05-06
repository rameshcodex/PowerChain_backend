const User = require("../../../models/user");
const { deleteFile } = require("../../../middleware/upload");
const fs = require("fs");
const path = require("path");
const { handleError } = require("../../../middleware/utils");


const updateProfileImage = async (req, res) => {
  try {

    const { image } = req.body;
    //  Validate upload
    if (!image || typeof image !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'No image provided',
      });
    }
    const matches = image.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image format',
      });
    }
    const [, mimeType, base64Data] = matches;
    if (!base64Data) {
      return res.status(400).json({
        success: false,
        message: 'Invalid base64 image data',
      });
    }

    //  Get logged-in user
    const user = await User.findById(req.user?._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    //  Delete OLD image from disk (if exists)
    if (user.image) {
      deleteFile(user.image);
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const ext = mimeType === 'png' ? 'png' : 'jpg';
    const filename = `avatar-${user._id}-${Date.now()}.${ext}`;

    // Ensure directory exists at the backend root uploads folder
    const uploadPath = path.resolve(__dirname, '..', '..', '..', '..', 'uploads', 'avatars');
    try {
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      // Save file
      const filePath = path.join(uploadPath, filename);
      fs.writeFileSync(filePath, buffer);

    } catch (fileError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to save image file',
      });
    }

    const newImageUrl = `${req.protocol}://${req.get("host")}/uploads/avatars/${filename}`;

    user.image = newImageUrl;
    await user.save();

    res.status(200).json({
      success: true,
      result: user,
      message: "Profile image updated successfully",
    });

  } catch (error) {
    handleError(res, error);
  }
};

module.exports = { updateProfileImage };
