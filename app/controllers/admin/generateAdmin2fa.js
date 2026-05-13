const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const Admin = require("../../models/admin");
const { handleError } = require("../../middleware/utils");

const generateAdmin2fa = async (req, res) => {
    try {
        const admin = await Admin.findById(req.user._id);

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }

        if (admin.twoFAEnabled === true) {
            return res.status(400).json({
                success: false,
                message: "2FA already enabled",
            });
        }

        let base32Secret;
        const issuer = "Power Chain";
        const label = `${issuer}:${admin.email}`;

        if (admin.twoFASecret && admin.twoFAEnabled === false) {
            base32Secret = admin.twoFASecret;
        } else {
            const generated = speakeasy.generateSecret({
                length: 20,
                name: label,
                issuer: issuer,
            });

            base32Secret = generated.base32;
            admin.twoFASecret = base32Secret;
            admin.twoFAEnabled = false;
            await admin.save();
        }

        const encodedIssuer = encodeURIComponent(issuer);
        const encodedEmail = encodeURIComponent(admin.email);
        const otpauth_url = `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${base32Secret}&issuer=${encodedIssuer}`;

        const qrCodeDataURL = await QRCode.toDataURL(otpauth_url);

        return res.status(200).json({
            success: true,
            result: {
                qrCode: qrCodeDataURL,
                otpauth_url: otpauth_url,
                manualCode: base32Secret,
            },
            message: "2FA setup initiated",
        });
    } catch (error) {
        handleError(res, error);
    }
};

module.exports = { generateAdmin2fa };
