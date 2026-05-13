const { BrevoClient } = require('@getbrevo/brevo');
const User = require('../../models/user');
const Campaign = require('../../models/campaign');

const batchJoinContactList = async (req, res) => {
    try {

        const { campaign_id, userIds = [] } = req.body;

        // Validate campaign_id
        if (!campaign_id) {
            return res.code(400).send({
                success: false,
                message: "campaign_id is required"
            });
        }

        // Find campaign
        const campaign = await Campaign.findById(campaign_id);

        if (!campaign) {
            return res.code(404).send({
                success: false,
                message: "Campaign not found"
            });
        }

        // Build filter
        let filter = {
            type: campaign.type
        };

        // Filter by userIds if provided
        if (userIds?.length > 0) {
            filter._id = { $in: userIds };
        }

        // Fetch users with valid emails
        const users = await User.find({
            ...filter,
            email: { $exists: true, $ne: null }
        }).lean();

        if (!users.length) {
            return res.code(404).send({
                success: false,
                message: "No users found for this campaign"
            });
        }

        // Remove duplicate emails
        const uniqueUsers = Array.from(
            new Map(users.map(user => [user.email, user])).values()
        );

        // Brevo client
        const client = new BrevoClient({
            apiKey: process.env.BREVO_API_KEY,
        });

        const LIST_ID = campaign.list_id;

        // Create/update contacts in Brevo
        const contactsPromise = uniqueUsers.map(async (user) => {
            return client.contacts.createContact({
                email: user.email,
                updateEnabled: true,
                listIds: [LIST_ID],
                attributes: {
                    USERNAME: `${user.firstname || ""} ${user.lastname || ""}`.trim(),
                    FIRSTNAME: user.firstname || "",
                    LASTNAME: user.lastname || "",
                }
            });
        });

        // Prevent single failure from breaking all
        const contactsResult = await Promise.allSettled(contactsPromise);

        const successContacts = contactsResult.filter(
            result => result.status === "fulfilled"
        );

        const failedContacts = contactsResult.filter(
            result => result.status === "rejected"
        );

        return res.code(200).send({
            success: true,
            added_count: successContacts.length,
            failed_count: failedContacts.length,
            added_users: uniqueUsers.map(user => user.email),
            failed_errors: failedContacts.map(error => error.reason?.message),
            message: "User processed successfully"
        });

    } catch (error) {

        console.error("Batch Join Contact List Error:", error);

        return res.code(500).send({
            success: false,
            message: error.message || "Something went wrong"
        });
    }
};

module.exports = {
    batchJoinContactList
};