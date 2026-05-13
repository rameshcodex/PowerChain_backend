const Campaign = require('../../models/campaign');

const deleteCampaign = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedCampaign = await Campaign.findByIdAndDelete(id);

        if (!deletedCampaign) {
            return res.code(404).send({ success: false, message: "Campaign not found." });
        }

        res.code(200).send({ success: true, message: "Campaign deleted successfully." });
    } catch (error) {
        console.error("🚀 ~ deleteCampaign ~ error:", error);
        res.code(500).send({ success: false, message: error.message });
    }
};

module.exports = { deleteCampaign };
