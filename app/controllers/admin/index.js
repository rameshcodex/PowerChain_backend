const { getAllUsers } = require("./getAllUser");
const { getUserById } = require("./getUserById");
const { updateUserStatus, updateUserTradeStatus } = require("./updateUserStatus");
const { deleteUser } = require("./deleteUser");
const { adminLogin } = require("./adminLogin");
const { adminRegister } = require("./adminRegister");
const { getAllOkxPairs, updateOkxPairStatus } = require("./okxPairs");
const { getAllKYC } = require("./getAllKyc");
const { setCommission } = require("./setCommission");
const { updatePairs } = require("./updatePairs");
const { getPairById } = require("./getPairById");
const { batchJoinContactList } = require('./batchJoinContactList')
const { joinContactList } = require('./joinContactList')
const { sendCampineEmail } = require('./sendCampineEmail')
const { createCampaign } = require('./createCampaign');
const { getCampaigns, getCampaignById } = require('./getCampaigns');
const { updateCampaign } = require('./updateCampaign');
const { deleteCampaign } = require('./deleteCampaign');
const { getContactFromBrevo } = require('./getContactFromBrevo');
const { updateKYCStatus } = require("./updateKYCStatus");
const { getEmailContent } = require("./getEmailContent");
const { getTemplates } = require("./getEmailTemplateDesign");
const { editTemplate } = require("./editEmailTemplateDesign");
const { editEmailContent } = require("./editEmailContent");
const { deleteTemplateDesign } = require("./deleteTemplateDesign");
const { addEmailContent } = require("./addEmailContent");
const { addTemplate } = require("./addEmailTemplateDesign");
const { deleteEmailContent } = require("./deleteEmailContent");
const { createRole } = require("./createRole");
const { updateRole } = require("./updateRole");
const { getRoles } = require("./getRoles");
const { createStaff } = require("./createStaff");
const { updateStaff } = require("./updateStaff");
const { getStaffById } = require("./getStaffById");
const { getStaffList } = require("./getStaffList");
const { updateStaffStatus } = require("./updateStaffStatus");
const { changeAdminPassword } = require("./changeAdminPassword");
const { updateAdminProfile } = require("./updateAdminProfile");
const { generateAdmin2fa } = require("./generateAdmin2fa");
const { verifyAdmin2fa } = require("./verifyAdmin2fa");
const { disableAdmin2fa } = require("./disableAdmin2fa");
const { admin2faLogin } = require("./admin2faLogin");
const { getAdminProfile } = require("./getAdminProfile");

module.exports = {
    getAllUsers,
    getUserById,
    updateUserStatus,
    updateUserTradeStatus,
    deleteUser,

    adminLogin,
    adminRegister,
    changeAdminPassword,
    updateAdminProfile,
    generateAdmin2fa,
    verifyAdmin2fa,
    disableAdmin2fa,
    admin2faLogin,
    getAdminProfile,

    getAllOkxPairs,
    updateOkxPairStatus,
    updatePairs,
    getPairById,

    getAllKYC,
    updateKYCStatus,

    setCommission,

    addEmailContent,
    getEmailContent,
    editEmailContent,
    deleteEmailContent,
    addTemplate,
    getTemplates,
    editTemplate,
    deleteTemplateDesign,

    createCampaign,
    getCampaigns,
    getCampaignById,
    updateCampaign,
    deleteCampaign,
    getContactFromBrevo,
    joinContactList,
    batchJoinContactList,
    sendCampineEmail,

    createRole,
    getRoles,
    updateRole,
    // deleteRole,
    createStaff,
    getStaffList,
    getStaffById,
    updateStaff,
    // deleteStaff,
    updateStaffStatus,
};