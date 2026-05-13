const TemplateDesign = require("../../models/emailTemplateDesign");


const editTemplate = async (req, res) => {
  try {
    const data = req.body;

    if (data.isDefault === true) {
      await TemplateDesign.updateMany(
        { template_name: { $ne: data.template_name } },
        { $set: { isDefault: false } }
      );
    }

    const updateFields = {};

    if (data.html !== undefined) {
      updateFields.html = data.html;
    }

    if (data.isDefault !== undefined) {
      updateFields.isDefault = data.isDefault;
    }

    const updated = await TemplateDesign.findOneAndUpdate(
      { template_name: data.template_name },
      { $set: updateFields },
      { new: true }
    );

    if (!updated) {
      return res.code(404).send({
        success: false,
        message: "Template not found",
      });
    }

    return res.send({
      success: true,
      result: updated,
      message: "Template updated successfully",
    });
  } catch (err) {
    console.error("editTemplate error:", err);
    return res.code(500).send({
      success: false,
      message: "Error updating template",
    });
  }
};
module.exports = { editTemplate }
