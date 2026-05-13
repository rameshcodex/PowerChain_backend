const EmailTemplate = require("../../models/emailTemplate");
const TemplateDesign = require("../../models/emailTemplateDesign");

function transformTemplate(template) {
    return template.replace(/{{\s*(?!contact\.)([^}]+)\s*}}/g, (_, key) => {
        const trimmed = key.trim()?.toUpperCase();

        return `{{ contact.${trimmed} }}`;
    });
}

const getRenderedCampaignEmailByEvent = async (event_key) => {
    const emailContent = await EmailTemplate.findOne({
        event_key,
        is_active: true,
    }).lean();

    if (!emailContent) {
        throw new Error("Email content not found");
    }

    let selectedTemplate = null;

    // If event has custom template
    if (emailContent.template_name) {
        selectedTemplate = await TemplateDesign.findOne({
            template_name: emailContent.template_name,
        }).lean();
    }

    // fallback to default template
    if (!selectedTemplate) {
        selectedTemplate = await TemplateDesign.findOne({
            isDefault: true,
        }).lean();
    }

    if (!selectedTemplate) {
        throw new Error("No default template found");
    }

    let finalHtml = selectedTemplate.html;

    finalHtml = finalHtml.replace(/{{subject}}/g, emailContent.subject || "");
    finalHtml = finalHtml.replace(/{{content}}/g, emailContent.body || "");

    // Replace all {{variable}} with <%variable%>
    finalHtml = transformTemplate(finalHtml);


    return {
        subject: emailContent.subject,
        body: emailContent.body,
        template_name: emailContent.template_name || selectedTemplate.template_name,
        html: finalHtml,
    };
};

module.exports = { getRenderedCampaignEmailByEvent };