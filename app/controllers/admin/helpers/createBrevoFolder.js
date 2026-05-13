const { BrevoClient, BrevoError } = require('@getbrevo/brevo');

async function createBrevoFolder(folderName) {
    try {
        const client = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });

        const response = await client.contacts.createFolder({
            name: folderName,
        });
        console.log("🚀 ~ createBrevoFolder ~ response:", response)
        return { success: true, message: "Folder created successfully", result: response };
    } catch (error) {
        if (error instanceof BrevoError) return { success: false, message: `API error ${error.statusCode}: ${error.message}` };
        else return { success: false, message: error.message };
    }
}

const createBrevoFolderController = async (req, reply) => {
    try {
        const { folderName } = req.body;
        console.log(folderName, "🚀 ~ createBrevoFolderController ~ folderName:")
        const result = await createBrevoFolder(folderName);
        console.log("🚀 ~ createBrevoFolderController ~ result:", result)
        if (!result.success) {
            return reply?.code(400).send({ success: false, message: result.message });
        }
        reply?.code(200)?.send({ success: true, result: result.result, message: result.message });
    } catch (error) {
        console.log("🚀 ~ createBrevoFolderController ~ error:", error)
        reply?.code(400).send({ success: false, message: error.message });
    }
}

module.exports = { createBrevoFolder, createBrevoFolderController }