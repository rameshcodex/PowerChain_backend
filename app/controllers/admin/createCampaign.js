const { BrevoClient, BrevoError } = require('@getbrevo/brevo');
const Campaign = require('../../models/campaign');
const emailTemplate = require('../../models/emailTemplate');

const individual_id = process.env.INDIVIDUAL_ID;
const professional_id = process.env.PROFESSIONAL_ID;

const createCampaign = async (req, res) => {
    try {
        const { campaign_name, content_id, type } = req.body;

        const formatedCampaignName = campaign_name?.toLowerCase();
        const folder_id = type === "individual" ? Number(individual_id) : Number(professional_id);

        const [content, campaign] = await Promise.all([
            emailTemplate.findById(content_id),
            Campaign.findOne({ campaign_name: formatedCampaignName, type })
        ]);

        if (!content) {
            return res.code(200).send({ success: false, message: "Content not found" });
        }

        if (campaign) {
            return res.code(200).send({ success: false, message: "Campaign already exists" });
        }

        const client = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });

        const list = await client.contacts.createList({
            folderId: folder_id,
            name: formatedCampaignName
        });

        const newCampaign = await Campaign.create({
            type,
            content_id,
            campaign_name: formatedCampaignName,
            list_id: list.id,
            folder_id: folder_id,
        });

        res.code(201).send({ success: true, result: newCampaign, message: "Campaign created successfully" });
    } catch (error) {
        if (error instanceof BrevoError) return res.code(400).send({ success: false, message: `Brevo API Error: ${error.message}` });

        res.code(500).send({ success: false, message: error.message });
    }
};

module.exports = { createCampaign };
