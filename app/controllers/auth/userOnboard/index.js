const { register } = require("./register");
const { submitKYC } = require("./submitKYC");
const { getKYC } = require("./getKYC");
const { login } = require("./login");
const { profileimageUploader } = require("./profileImageUploader");
const { refreshToken } = require("./refreshToken");
const { resetpassword } = require("./resetPassword");
const { resendOTP } = require("./resendOtp");



module.exports = {
    register,
    submitKYC,
    getKYC,
    login,
    profileimageUploader,
    refreshToken, resetpassword,
    resendOTP,
};
