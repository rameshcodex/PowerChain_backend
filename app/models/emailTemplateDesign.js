const mongoose = require("mongoose");

const templateDesignSchema = new mongoose.Schema({
    template_name: {
        type: String,
        required: true,
        unique: true
    },
    html: {
        type: String,
        required: true
    },

    isDefault: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const TemplateDesign = mongoose.model("template_design", templateDesignSchema);

module.exports = TemplateDesign;