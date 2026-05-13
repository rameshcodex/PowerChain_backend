const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema({
    campaign_name: {
        type: String,
        required: true
    },
    list_id: {
        type: Number,
        required: true
    },
    content_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "emailtemplate",
        required: true
    },
    type: {
        type: String,
        enum: ["professional", "individual"],
        required: true
    },
    status: {
        type: Boolean,
        default: true
    },
    folder_id: {
        type: Number,
        required: true
    },

}, { timestamps: true });


const Campaign = mongoose.model("Campaign", campaignSchema);

module.exports = Campaign;
