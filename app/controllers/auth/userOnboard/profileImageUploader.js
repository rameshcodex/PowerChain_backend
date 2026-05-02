const User = require("../../../models/user");
const { deleteFile } = require("../../../middleware/upload");

const updateProfileImage = async (req, res) => {
  try {
    //  Validate upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded",
      });
    }

    //  Get logged-in user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    //  Delete OLD image from disk (if exists)
    if (user.image) {
      deleteFile(user.image);
    }

    const newImageUrl = `${req.protocol}://${req.get("host")}/uploads/avatars/${req.file.filename}`;

    user.image = newImageUrl;
    await user.save();

    res.status(200).json({
      success: true,
      result: user,
      message: "Profile image updated successfully",
    });

  } catch (error) {
    console.error("Image update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile image",
    });
  }
};

module.exports = { updateProfileImage };
