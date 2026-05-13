const mongoose = require("mongoose");
const TemplateDesign = require("../../models/emailTemplateDesign");

const getTemplates = async (req, res) => {
  try {
    const { _id, isDefault } = req.body || {};

    let matchStage = {};

    if (_id) {
      if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.code(400).send({
          success: false,
          message: "Invalid _id",
        });
      }

      matchStage._id = new mongoose.Types.ObjectId(_id);
    }

    if (isDefault !== undefined) {
      matchStage.isDefault = isDefault;
    }

    const templates = await TemplateDesign.aggregate([
      { $match: matchStage },

      {
        $addFields: {
          isDefault: { $ifNull: ["$isDefault", false] },
        },
      },

      { $sort: { createdAt: -1 } },
    ]);

    return res.send({
      success: true,
      result: _id ? templates[0] || null : templates,
    });

  } catch (err) {
    console.log(err);
    return res.code(500).send({
      success: false,
      message: "Error fetching templates",
    });
  }
};

module.exports = { getTemplates };