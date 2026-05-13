const emailTemplate = require("../../models/emailTemplate");
const TemplateDesign = require("../../models/emailTemplateDesign");

const editEmailContent = async (req, res) => {
  try {
    const data = req.body;

    const existing = await emailTemplate.findOne({
      event_key: data.event_key,
    });

    if (!existing) {
      return res.code(404).send({
        success: false,
        message: "Email template not found",
      });
    }

    // validate only if template_name is not null and not empty
    if (data.template_name !== undefined && data.template_name !== null && data.template_name !== "") {
      const templateExists = await TemplateDesign.findById(data.template_name);

      if (!templateExists) {
        return res.code(400).send({
          success: false,
          message: `Template '${data.template_name}' not found in template_design`,
        });
      }
    }

    const updateData = {};

    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.body !== undefined) updateData.body = data.body;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    if (data.event_key !== undefined) updateData.event_key = data.event_key;


    // allow null => fallback to default template
    if (data.template_name !== undefined) {
      updateData.template_name = data.template_name || null;
    }

    const updated = await emailTemplate.findOneAndUpdate(
      { event_key: data.event_key },
      { $set: updateData },
      { new: true }
    );

    return res.send({
      success: true,
      result: updated,
      message: "Email template updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.code(500).send({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { editEmailContent };