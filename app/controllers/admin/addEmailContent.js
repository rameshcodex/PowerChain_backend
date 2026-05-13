const emailTemplate = require("../../models/emailTemplate");
const TemplateDesign = require("../../models/emailTemplateDesign");
const mongoose = require("mongoose");

const addEmailContent = async (req, res) => {
  try {
    const data = req.body;

    const exists = await emailTemplate.findOne({
      event_key: data.event_key,
    });

    if (exists) {
      return res.code(400).send({
        success: false,
        message: "Event key already exists",
      });
    }

    let templateObjectId = null;

    if (data.template_name) {
      const templateExists = await TemplateDesign.findById(data.template_name);

      if (!templateExists) {
        return res.code(400).send({
          success: false,
          message: "Invalid template_name (not found in template_design)",
        });
      }

      // Force store as Mongo ObjectId
      templateObjectId = new mongoose.Types.ObjectId(templateExists._id);
    }

    const newTemplate = await emailTemplate.create({
      event_key: data.event_key,
      subject: data.subject,
      body: data.body,
      template_name: templateObjectId,
      is_active: data.is_active ?? true,
      type: data.type || "campaign",
    });

    return res.code(200).send({
      success: true,
      result: newTemplate,
      message: "Email template added successfully",
    });
  } catch (error) {
    console.error(error);
    return res.code(500).send({
      success: false,
      message: "Something went wrong",
    });
  }
};

module.exports = { addEmailContent };