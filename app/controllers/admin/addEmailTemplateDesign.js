const TemplateDesign = require("../../models/emailTemplateDesign");

const addTemplate = async (req, res) => {
  try {
    const data = req.body;

    const exists = await TemplateDesign.findOne({
      template_name: data.template_name,
    });

    if (exists) {
      return res.code(400).send({
        success: false,
        message: "Template already exists",
      });
    }

    // ✅ If setting default → reset others
    if (data.isDefault) {
      await TemplateDesign.updateMany({}, { $set: { isDefault: false } });
    }

    const newTemplate = await TemplateDesign.create({
      ...data,
      isDefault: data.isDefault ?? false, // fallback
    });

    return res.send({
      success: true,
      result: newTemplate,
      message: "Template added successfully",
    });

  } catch (err) {
    console.log(err);
    return res.code(500).send({
      success: false,
      message: "Something went wrong",
    });
  }
};


module.exports = {
  addTemplate,


};