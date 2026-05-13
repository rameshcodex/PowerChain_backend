const EmailTemplate = require("../../models/emailTemplate");

const deleteEmailContent = async (req, res) => {
  try {
    const { event_key } = req.body || {};

    // Find the template
    const templateDoc = await EmailTemplate.findOne({ event_key });

    if (!templateDoc) {
      return res.code(404).send({
        success: false,
        message: "Email template not found",
      });
    }


    await EmailTemplate.deleteOne({ event_key });


    console.log(`Deleted template: ${event_key}`);

    return res.code(200).send({
      success: true,
      result: null,
      message: "Email template deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting email template:", error);
    return res.code(500).send({
      success: false,
      message: "Something went wrong",
    });
  }
};

module.exports = { deleteEmailContent };