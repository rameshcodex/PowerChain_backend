const User = require("../../../models/user");
const { deleteFile } = require("../../../middleware/upload");
const fs = require("fs");
const path = require("path");

const updateProfileImage = async (req, res) => {
  try {
    console.log("Update profile image request received");
    console.log("req.body.image:", req.body.image ? "present" : "not present");
    console.log("req.user:", req.user);

    const { image } = req.body;



    //  Validate upload
    if (!image || typeof image !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'No image provided',
      });
    }


   console.log("IMAGES", image);
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

    console.log('User found:', user._id);

    //  Delete OLD image from disk (if exists)
    if (user.image) {
      console.log('Deleting old image:', user.image);
      deleteFile(user.image);
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const ext = mimeType === 'png' ? 'png' : 'jpg';
    const filename = `avatar-${user._id}-${Date.now()}.${ext}`;

    // Ensure directory exists at the backend root uploads folder
    const uploadPath = path.resolve(__dirname, '..', '..', '..', '..', 'uploads', 'avatars');
    console.log('Upload path:', uploadPath);
    try {
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
        console.log('Created upload directory');
      }

      // Save file
      const filePath = path.join(uploadPath, filename);
      console.log('File path:', filePath);
      fs.writeFileSync(filePath, buffer);

      console.log('Image file saved successfully, exists:', fs.existsSync(filePath));
    } catch (fileError) {
      console.error('Error saving image file:', fileError);
      return res.status(500).json({
        success: false,
        message: 'Failed to save image file',
      });
    }

    const newImageUrl = `${req.protocol}://${req.get("host")}/uploads/avatars/${filename}`;
    console.log("New image URL:", newImageUrl);

    user.image = newImageUrl;
    await user.save();

    console.log("Profile image updated successfully");

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
