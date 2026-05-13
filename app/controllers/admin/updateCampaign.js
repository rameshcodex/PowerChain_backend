const { Campaign } = require('../../models/campaign');
const { emailTemplate } = require('../../models/emailTemplate');

const updateCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        const { content_id } = req.body;

        const [campaign, content] = await Promise.all([
            Campaign.findById(id),
            emailTemplate.findOne({ _id: content_id, type: "campaign" })
        ]);

        if (!content) {
            return res.code(200).send({ success: false, message: "Content not found." });
        }
        if (!campaign) {
            return res.code(200).send({ success: false, message: "Campaign not found." });
        }

        const updateData = { content_id };

        const updatedCampaign = await Campaign.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedCampaign) {
            return res.code(200).send({ success: false, message: "Campaign not updated." });
        }

        return res.code(200).send({ success: true, result: updatedCampaign, message: "Campaign updated successfully." });
    } catch (error) {
        console.error("🚀 ~ updateCampaign ~ error:", error);
        return res.code(500).send({ success: false, message: error.message });
    }
};

module.exports = { updateCampaign };
