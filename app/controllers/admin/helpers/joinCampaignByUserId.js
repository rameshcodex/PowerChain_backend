const { BrevoClient, BrevoError } = require('@getbrevo/brevo')
const User = require('../../../models/user')
const Campaign = require('../../../models/campaign')

const joinCampaignByUserId = async (user_id, campaign_id) => {
    try {
        if (!campaign_id) {
            return ({ success: false, message: "campaign_id is required" });
        }

        const campaign = await Campaign.findById(campaign_id);

        if (!campaign) {
            return ({ success: false, message: "Campaign not found" });
        }

        const client = new BrevoClient({
            apiKey: process.env.BREVO_API_KEY,
        });

        const LIST_ID = campaign.list_id;

        const user = await User.findById(user_id).lean();

        if (user && user.email) {
            await client.contacts.createContact({
                email: user.email,
                updateEnabled: true,
                listIds: [LIST_ID],
                attributes: {
                    USERNAME: `${user.firstname} ${user.lastname}`,
                    FIRSTNAME: user.firstname,
                    LASTNAME: user.lastname,
                }
            });

            return { success: true, email: user.email, message: "User added to campaign successfully" };
        } else {
            return ({ success: false, message: "User not found or email missing" });
        }
    } catch (error) {
        if (error instanceof BrevoError) return { success: false, message: `API error ${error.statusCode}: ${error.message}` };
        else return { success: false, message: error.message };
    }
};

module.exports = { joinCampaignByUserId };