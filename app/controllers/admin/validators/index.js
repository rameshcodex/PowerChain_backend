module.exports = {
    updatePairsValidator: require("./updatePairsValidator").updatePairsValidator,
    validateCreateCampaign: require("./validateCreateCampaign").validateCreateCampaign,
    validateUpdateCampaign: require("./validateUpdateCampaign").validateUpdateCampaign,
    addTemplateValidator: require("./EmailtemplateDesignValidator").addTemplateValidator,
    updateTemplateValidator: require("./EmailtemplateDesignValidator").updateTemplateValidator,
    addEmailContentValidator: require("./addEmailContentValidator").addEmailContentValidator,

    createRoleValidation: require("./subadminValidatiors").createRoleValidation,
    updateRoleValidation: require("./subadminValidatiors").updateRoleValidation,
    createStaffValidation: require("./subadminValidatiors").createStaffValidation,
    updateStaffValidation: require("./subadminValidatiors").updateStaffValidation,
    updateStaffStatusValidation: require("./subadminValidatiors").updateStaffStatusValidation,
}