const { BrevoClient } = require('@getbrevo/brevo');
const { Campaign } = require("../../models/campaign");
const { emailTemplate } = require("../../models/emailTemplate");
const { getRenderedCampaignEmailByEvent } = require('../../services/email/getRenderedCampaignEmailByEvent');
const ejs = require("ejs");

const sendCampineEmail = async (req, res) => {
    try {


        const datas = req?.body;

        const campaign = await Campaign.findById(datas?.campaign_id);
        console.log("🚀 ~ sendCampineEmail ~ campaign:", campaign, datas)
        const content = await emailTemplate.findById(campaign?.content_id);

        if (!campaign) {
            return res?.code(404)?.send({ success: false, message: "Campaign not found" });
        }

        if (!content) {
            return res?.code(404)?.send({ success: false, message: "Content not found" });
        }

        const template = await getRenderedCampaignEmailByEvent(content.event_key);

        const emailHtml = ejs.render(template.html,
            // {
            //   otp: emailOtp,
            //   username: firstname + lastname,
            // }
        );

        const client = new BrevoClient({
            apiKey: process.env.BREVO_API_KEY, // Passed in headers as api-key [3-5]
        });

        const LIST_ID = campaign.list_id; // Target list ID

        // 1. Create the Email Campaign
        const campaignData = await client.emailCampaigns.createEmailCampaign({

            name: `${campaign?.campaign_name}  ${new Date().getTime()}`,
            subject: content?.subject, // Subject from admin input [4]
            htmlContent: emailHtml, // HTML body from admin input
            recipients: {
                listIds: [LIST_ID] // Targets users in list ID 2 [6, 7]
            },
            sender: {
                name: "Jokko Wallet",
                email: process.env.EMAIL_FROM_ADDRESS
            }

        });

        console.log("123456789", [LIST_ID]);
        const CAMPAIGN_ID = campaignData.id;
        // const CAMPAIGN_ID = 1
        console.log("Campaign created successfully with ID:", CAMPAIGN_ID);

        // 2. Send the Campaign Immediately
        // Uses the sendNow endpoint [8, 9]
        await client.emailCampaigns.sendEmailCampaignNow({
            campaignId: CAMPAIGN_ID
        });

        console.log("Campaign has been scheduled to send!");
        return res?.code(200)?.send({ success: true, message: "Campaign has been scheduled to send!" });
    } catch (error) {
        console.log("🚀 ~ sendCampineEmail ~ error:", error);
        return res?.code(400)?.send({ success: false, message: error.message });
    }
}

module.exports = {
    sendCampineEmail
}