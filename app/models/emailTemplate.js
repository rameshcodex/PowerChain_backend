const mongoose = require("mongoose");

const emailTemplateSchema = new mongoose.Schema({
    event_key: {
        type: String,
    },
    subject: {
        type: String
    },
    body: {
        type: String
    },

    is_active: {
        type: Boolean,
        default: true
    },

    template_name: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "template_design",
        required: true,
    },
    type: {
        type: String,
        enum: ["campaign", "transactional"],
        default: "campaign"
    }


}, { timestamps: true });

const emailTemplate = mongoose.model("emailtemplate", emailTemplateSchema);

module.exports = emailTemplate;