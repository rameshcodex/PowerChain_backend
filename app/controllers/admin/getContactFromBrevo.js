const { BrevoClient } = require('@getbrevo/brevo');

const getContact = async (email) => {
    try {
        const client = new BrevoClient({
            apiKey: process.env.BREVO_API_KEY,
        });

        const contact = await client.contacts.getContactInfo({ identifier: email });

        return contact;
    } catch (error) {
        console.log("🚀 ~ getContactFromBrevo ~ error:", error)
        throw error;
    }
}

const getContactFromBrevo = async (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.code(400).send({ success: false, message: "Email is required" });
        }

        const response = await getContact(email);

        res.code(200).send({ success: true, result: response, message: "Contact fetched successfully" });
    } catch (error) {
        console.log("🚀 ~ getContactFromBrevo ~ error:", error)
        res.code(500).send({ success: false, message: error.message });
    }
}

module.exports = { getContact, getContactFromBrevo }