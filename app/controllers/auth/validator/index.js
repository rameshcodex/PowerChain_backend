const index = require({
    registerValidator: "./registerValidator",
    verifyOtpValidator: "./verifyOtpValidator",
    forgetPasswordValidator: "./forgetPasswordValidator",    
    verifyOtpForLoggedUsersValidator: "./verifyOtpForLoggedUsersValidator",
    loginValidator: "./loginValidator",
    resetPasswordValidator: "./resetPasswordValidator",   
    resendotpValidator: "./resendotpValidator"   })

module.exports = index  