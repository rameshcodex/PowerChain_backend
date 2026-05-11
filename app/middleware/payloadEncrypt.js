const CryptoJS = require("crypto-js");

const SECRET_KEY = process.env.PAYLOAD_SECRET;
const ENCRYPTED_PAYLOAD_KEYS = ["data", "payload", "encryptedData"];

const encryptPayload = (payload) => {
    if (!SECRET_KEY) {
        throw new Error("PAYLOAD_SECRET is missing");
    }

    const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(payload),
        SECRET_KEY
    ).toString();

    return {
        data: encrypted,
    };
};

const decryptPayload = (encryptedData) => {
    if (!SECRET_KEY) {
        throw new Error("PAYLOAD_SECRET is missing");
    }

    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);

    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);

    if (!decryptedText) {
        throw new Error("Invalid encrypted payload");
    }

    return JSON.parse(decryptedText);
};

module.exports = {
    encryptPayload,
    decryptPayload
};
