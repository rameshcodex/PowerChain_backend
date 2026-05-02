const index = require({
    registerValidator: "./registerValidator",
    verifyOtpValidator: "./verifyOtpValidator",
    forgetPasswordValidator: "./forgetPasswordValidator",    
    verifyOtpForLoggedUsersValidator: "./verifyOtpForLoggedUsersValidator",
    loginValidator: "./loginValidator",
    resetPasswordValidator: "./resetPasswordValidator",   
    })

module.exports = index