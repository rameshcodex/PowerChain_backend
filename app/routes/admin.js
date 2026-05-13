const express = require("express");
const router = express.Router();

// Middlewares
const { tokenValidator } = require("../middleware/auth/tokenValidator");
const { roleAuthorization } = require("../middleware/auth");

// Controllers
const {
    getAllUsers,
    getUserById,
    updateUserStatus,
    deleteUser,
    getAllKYC,
    setCommission,
    updateUserTradeStatus,
    updatePairs,
    getPairById,
    getAllOkxPairs,
    updateOkxPairStatus,
    updateKYCStatus,
    createCampaign,
    getCampaigns,
    getCampaignById,
    updateCampaign,
    deleteCampaign,
    sendCampineEmail,
    joinContactList,
    batchJoinContactList,
    getContactFromBrevo,
    addTemplate,
    getTemplates,
    editTemplate,
    deleteTemplateDesign,
    addEmailContent,
    getEmailContent,
    editEmailContent,
    deleteEmailContent,
    createRole,
    getRoles,
    updateRole,
    createStaff,
    getStaffList,
    getStaffById,
    updateStaff,
    updateStaffStatus,
    getAdminProfile,
    updateAdminProfile,
    changeAdminPassword,
    generateAdmin2fa,
    verifyAdmin2fa,
    disableAdmin2fa,
    admin2faLogin
} = require("../controllers/admin");

//Validators
const {
    updatePairsValidator,
    addEmailContentValidator,
    addTemplateValidator,
    updateTemplateValidator,
    createRoleValidation,
    updateRoleValidation,
    createStaffValidation,
    updateStaffValidation,
    updateStaffStatusValidation
} = require("../controllers/admin/validators");



//Admin Auth Routes
router.post("/change-password", tokenValidator, roleAuthorization(['admin', 'superadmin', 'subadmin']), changeAdminPassword);
router.get("/generate-2fa", tokenValidator, roleAuthorization(['admin', 'superadmin', 'subadmin']), generateAdmin2fa);
router.post("/verify-2fa", tokenValidator, roleAuthorization(['admin', 'superadmin', 'subadmin']), verifyAdmin2fa);
router.post("/disable-2fa", tokenValidator, roleAuthorization(['admin', 'superadmin', 'subadmin']), disableAdmin2fa);
router.post("/login-2fa", admin2faLogin);

//Admin Profile Routes
router.get("/profile", tokenValidator, roleAuthorization(['admin', 'superadmin', 'subadmin']), getAdminProfile);
router.put("/profile", tokenValidator, roleAuthorization(['admin', 'superadmin', 'subadmin']), updateAdminProfile);

//KYC Routes
router.get("/get-all-kyc", tokenValidator, roleAuthorization(['admin', 'superadmin', 'subadmin']), getAllKYC);
router.patch("/kyc/:kycId/status", tokenValidator, roleAuthorization(['admin', 'superadmin', 'subadmin']), updateKYCStatus);

//User Management Routes
router.get("/users", tokenValidator, roleAuthorization(['admin', 'superadmin']), getAllUsers);
router.get("/user-detail", tokenValidator, roleAuthorization(['admin', 'superadmin']), getUserById);
router.post("/user-update-status", tokenValidator, roleAuthorization(['admin', 'superadmin']), updateUserStatus);
router.post("/user-trade-status", tokenValidator, roleAuthorization(['admin', 'superadmin']), updateUserTradeStatus);
router.post("/user-delete", tokenValidator, roleAuthorization(['admin', 'superadmin']), deleteUser);

//OKX Pairs Management Routes
router.post("/okx-pairs-update-status", tokenValidator, roleAuthorization(['admin', 'superadmin']), updateOkxPairStatus);
router.post("/pairs-update/:id", tokenValidator, roleAuthorization(['admin', 'superadmin']), updatePairsValidator, updatePairs);

//Trade Configurations Routes
router.post("/set-commission", tokenValidator, roleAuthorization(['admin', 'superadmin']), setCommission);

//Email Campaign Routes
router.post("/campaigns", tokenValidator, roleAuthorization(['admin', 'superadmin']), createCampaign);
router.get("/campaigns", tokenValidator, roleAuthorization(['admin', 'superadmin']), getCampaigns);
router.get("/campaign/:id", tokenValidator, roleAuthorization(['admin', 'superadmin']), getCampaignById);
router.put("/campaign/:id", tokenValidator, roleAuthorization(['admin', 'superadmin']), updateCampaign);
router.delete("/campaign/:id", tokenValidator, roleAuthorization(['admin', 'superadmin']), deleteCampaign);
router.get("/campaign/get-contacts", tokenValidator, roleAuthorization(['admin', 'superadmin']), getContactFromBrevo);
router.post("/campaign/:id/join", tokenValidator, roleAuthorization(['admin', 'superadmin']), joinContactList);
router.post("/campaign/:id/batch-join", tokenValidator, roleAuthorization(['admin', 'superadmin']), batchJoinContactList);
router.post("/campaign/:id/send", tokenValidator, roleAuthorization(['admin', 'superadmin']), sendCampineEmail);

//Email Template Routes
router.post("/template", tokenValidator, roleAuthorization(['admin', 'superadmin']), addTemplateValidator, addTemplate);
router.get("/template", tokenValidator, roleAuthorization(['admin', 'superadmin']), getTemplates);
router.put("/template/:id", tokenValidator, roleAuthorization(['admin', 'superadmin']), updateTemplateValidator, editTemplate);
router.delete("/template/:id", tokenValidator, roleAuthorization(['admin', 'superadmin']), deleteTemplateDesign);

//Email Content Routes
router.post("/email-content", tokenValidator, roleAuthorization(['admin', 'superadmin']), addEmailContentValidator, addEmailContent);
router.get("/email-content", tokenValidator, roleAuthorization(['admin', 'superadmin']), getEmailContent);
router.put("/email-content/:id", tokenValidator, roleAuthorization(['admin', 'superadmin']), addEmailContentValidator, editEmailContent);
router.delete("/email-content/:id", tokenValidator, roleAuthorization(['admin', 'superadmin']), deleteEmailContent);

//Role Management
router.post("/role", tokenValidator, roleAuthorization(['admin', 'superadmin']), createRoleValidation, createRole);
router.get("/role", tokenValidator, roleAuthorization(['admin', 'superadmin']), getRoles);
router.put("/role/:id", tokenValidator, roleAuthorization(['admin', 'superadmin']), updateRoleValidation, updateRole);
// router.delete("/role/:id", tokenValidator, roleAuthorization(['admin', 'superadmin']), deleteRole);

//Staff Management
router.post("/staff", tokenValidator, roleAuthorization(['admin', 'superadmin']), createStaffValidation, createStaff);
router.get("/staff", tokenValidator, roleAuthorization(['admin', 'superadmin']), getStaffList);
router.get("/staff/:id", tokenValidator, roleAuthorization(['admin', 'superadmin']), getStaffById);
router.put("/staff/:id", tokenValidator, roleAuthorization(['admin', 'superadmin']), updateStaffValidation, updateStaff);
// router.delete("/staff/:id", tokenValidator, roleAuthorization(['admin', 'superadmin']), deleteStaff);
router.put("/staff/:id/status", tokenValidator, roleAuthorization(['admin', 'superadmin']), updateStaffStatusValidation, updateStaffStatus);

module.exports = router;

