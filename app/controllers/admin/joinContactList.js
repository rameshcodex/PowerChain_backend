const { joinCampaignByUserId } = require("./helpers");

const joinContactList = async (req, res) => {
    try {
        const { campaign_id, user_id } = req.body;

        const result = await joinCampaignByUserId(user_id, campaign_id);

        if (!result.success) {
            return res?.code(400).send({ success: false, message: result.message });
        }

        res?.code(200)?.send({ success: true, result: result.email, message: "User added to campaign successfully" });
    } catch (error) {
        console.log("🚀 ~ joinContactList ~ error:", error);
        res?.code(400).send({ success: false, message: error.message });
    }
}

module.exports = { joinContactList }