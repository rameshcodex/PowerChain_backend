const Campaign = require('../../models/campaign');

const getCampaigns = async (req, res) => {
    try {
        const { type, page = 1, limit = 10 } = req.query;

        const options = {
            page: Number(page),
            limit: Number(limit),
            sort: { createdAt: -1 },
        };

        let filter = {};
        if (type) filter.type = type;

        const query = [
            {
                $match: filter
            },
            {
                $lookup: {
                    from: "emailtemplates",
                    localField: "content_id",
                    foreignField: "_id",
                    as: "content_info"
                }
            },
            {
                $unwind: "$content_info"
            },
            {
                $project: {
                    campaign_name: 1,
                    list_id: 1,
                    content_id: 1,
                    type: 1,
                    status: 1,
                    folder_id: 1,
                    content_info: 1,
                }
            },
            {
                $sort: { createdAt: -1 },
            }
        ]

        // const campaigns = await Campaign.aggregatePaginate(query, options);
        const campaigns = await Campaign.aggregate(query);

        return res.code(200).send({ success: true, result: campaigns, message: "Campaigns fetched successfully" });

    } catch (error) {
        console.error("🚀 ~ getCampaigns ~ error:", error);
        return res.code(500).send({ success: false, message: error.message });
    }
};

const getCampaignById = async (req, res) => {
    try {
        const { id } = req.params;
        const campaign = await Campaign.findById(id);

        if (!campaign) {
            return res.code(404).send({ success: false, message: "Campaign not found." });
        }

        res.code(200).send({ success: true, result: campaign, message: "Campaign fetched successfully" });
    } catch (error) {
        console.error("🚀 ~ getCampaignById ~ error:", error);
        res.code(500).send({ success: false, message: error.message });
    }
};

module.exports = { getCampaigns, getCampaignById };
