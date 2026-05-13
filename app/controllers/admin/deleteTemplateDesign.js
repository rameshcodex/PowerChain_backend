const mongoose = require("mongoose");
const TemplateDesign = require("../../models/emailTemplateDesign");

const deleteTemplateDesign = async (req, res) => {
  try {
    const { templateId } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      return res.code(400).send({
        success: false,
        message: "Invalid templateId",
        result: null,
      });
    }

    const existingTemplate = await TemplateDesign.findById(templateId);

    if (!existingTemplate) {
      return res.code(404).send({
        success: false,
        message: "Template not found",
        result: null,
      });
    }

    await TemplateDesign.findByIdAndDelete(templateId);

    return res.code(200).send({
      success: true,
      message: "Template deleted successfully",
      result: existingTemplate,
    });
  } catch (error) {
    console.error("deleteTemplateDesign Error:", error);
    return res.code(500).send({
      success: false,
      message: "Something Went Wrong",
      result: null,
    });
  }
};

module.exports = { deleteTemplateDesign };
