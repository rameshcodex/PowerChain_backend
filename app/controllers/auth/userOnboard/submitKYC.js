const KYC = require("../../../models/kyc");
const User = require("../../../models/user");
const { sendNotification } = require("../../../utils/notificationHelper");
const { notifyKycStatusChanged } = require("../../../utils/kycNotificationService");

const normalizeFiles = (files) => {
    if (Array.isArray(files)) {
        return files.reduce((acc, file) => {
            acc[file.fieldname] = acc[file.fieldname] || [];
            acc[file.fieldname].push(file);
            return acc;
        }, {});
    }

    return files || {};
};

const getFirstFile = (files, fieldNames) => {
    for (const fieldName of fieldNames) {
        if (files?.[fieldName]?.[0]) {
            return files[fieldName][0];
        }
    }

    return null;
};

const getFileUrl = (req, file) => {
    if (!file) return "";

    return `${req.protocol}://${req.get("host")}/uploads/kyc/${file.filename}`;
};

const parseJsonField = (value, fallback = {}) => {
    if (!value) return fallback;
    if (typeof value === "object") return value;

    try {
        return JSON.parse(value);
    } catch (error) {
        return fallback;
    }
};

const getNestedField = (body, parent, key) => {
    if (body?.[parent]?.[key]) return body[parent][key];

    return body?.[`${parent}[${key}]`];
};

const normalizeGender = (gender) => {
    if (!gender) return gender;

    const value = String(gender).toLowerCase();
    if (value === "male") return "Male";
    if (value === "female") return "Female";

    return gender;
};

const normalizeAddress = (body) => {
    const parsedAddress = parseJsonField(body.address, {});

    return {
        buildingno:
            parsedAddress.buildingno ||
            parsedAddress.building ||
            body.buildingno ||
            body.building ||
            getNestedField(body, "address", "buildingno") ||
            getNestedField(body, "address", "building"),
        street:
            parsedAddress.street ||
            body.street ||
            getNestedField(body, "address", "street"),
        city:
            parsedAddress.city ||
            body.city ||
            getNestedField(body, "address", "city"),
        state:
            parsedAddress.state ||
            body.state ||
            getNestedField(body, "address", "state"),
        residence:
            parsedAddress.residence ||
            parsedAddress.country ||
            body.residence ||
            body.country ||
            getNestedField(body, "address", "residence") ||
            getNestedField(body, "address", "country"),
        landmark:
            parsedAddress.landmark ||
            body.landmark ||
            getNestedField(body, "address", "landmark"),
    };
};

const submitKYC = async (req, res) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const {
            firstName,
            middleName,
            lastName,
            dob,
            dateOfBirth,
            gender,
            nationality,
            placeOfBirth,
            phone,
            phoneNumber,
            selectedDoc,
            documentType,
            selectIDType,
            idNumber,
            idenditynumber,
            expiryDate,
            dateofexpiry,
            personalinformation,
        } = req.body;

        const chosenDocument = selectedDoc || documentType || selectIDType;

        if (!["passport", "national_id", "driving_license"].includes(chosenDocument)) {
            return res.status(400).json({
                success: false,
                message: "Please choose a valid document type",
            });
        }

        const existingKYC = await KYC.findOne({ userId }).select("status");
        const currentKycStatus = existingKYC?.status || req.user?.kycStatus;

        if (["pending", "verified"].includes(currentKycStatus)) {
            return res.status(400).json({
                success: false,
                message: `KYC is already ${currentKycStatus}`,
            });
        }

        const files = normalizeFiles(req.files);
        const passportFile = getFirstFile(files, [
            "imgFile",
            "img",
            "image",
            "passport",
            "passportFront",
            "document",
            "documentFront",
        ]);
        const nationalFrontFile = getFirstFile(files, [
            "frontFile",
            "frontDocument",
            "frontDoc",
            "front",
            "frontImage",
            "documentFront",
            "nationalFront",
            "nationalIdFront",
            "nationalIDFront",
        ]);
        const nationalBackFile = getFirstFile(files, [
            "backFile",
            "backDocument",
            "backDoc",
            "back",
            "backImage",
            "documentBack",
            "nationalBack",
            "nationalIdBack",
            "nationalIDBack",
        ]);
        const drivingLicenseFile = getFirstFile(files, [
            "drivingLicenseFile",
            "drivingLicense",
            "driving_license",
            "licenseFile",
            "license",
            "greenBKFile",
            "document",
            "documentFront",
        ]);

        if (chosenDocument === "passport" && !passportFile) {
            return res.status(400).json({
                success: false,
                message: "Passport document image is required",
            });
        }

        if (chosenDocument === "national_id" && (!nationalFrontFile || !nationalBackFile)) {
            return res.status(400).json({
                success: false,
                message: "National ID front and back images are required",
            });
        }

        if (chosenDocument === "driving_license" && !drivingLicenseFile) {
            return res.status(400).json({
                success: false,
                message: "Driving license document image is required",
            });
        }

        const address = normalizeAddress(req.body);

        const bodyIdentification = parseJsonField(req.body.identification, {});

        const identification = {
            selectIDType: chosenDocument,
            idenditynumber:
                idNumber ||
                idenditynumber ||
                bodyIdentification.idNumber ||
                bodyIdentification.idenditynumber ||
                getNestedField(req.body, "identification", "idNumber") ||
                getNestedField(req.body, "identification", "idenditynumber"),
            dateofexpiry:
                expiryDate ||
                dateofexpiry ||
                bodyIdentification.expiryDate ||
                bodyIdentification.dateofexpiry ||
                getNestedField(req.body, "identification", "expiryDate") ||
                getNestedField(req.body, "identification", "dateofexpiry"),
            personalinformation:
                personalinformation === true ||
                personalinformation === "true" ||
                req.body.accepted === true ||
                req.body.accepted === "true",
        };

        if (chosenDocument === "passport") {
            identification.passportNumber = {
                frontimage: getFileUrl(req, passportFile),
            };
        }

        if (chosenDocument === "national_id") {
            identification.nationalID = {
                frontimage: getFileUrl(req, nationalFrontFile),
                backimage: getFileUrl(req, nationalBackFile),
            };
        }

        if (chosenDocument === "driving_license") {
            identification.documentupload = {
                frontimage: getFileUrl(req, drivingLicenseFile),
            };
        }

        const kyc = await KYC.findOneAndUpdate(
            { userId },
            {
                userId,
                firstName,
                middleName,
                lastName,
                dateOfBirth: dob || dateOfBirth,
                gender: normalizeGender(gender),
                nationality,
                placeOfBirth,
                phoneNumber: phone || phoneNumber,
                address,
                identification,
                status: "pending",
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true,
            }
        );

        await User.findByIdAndUpdate(userId, { kycStatus: "pending" });

        await sendNotification({
            userId,
            type: "kyc",
            event: "kyc_submitted",
            title: "KYC submitted",
            message: "Your KYC has been submitted and is pending review.",
            referenceId: String(kyc._id),
        });

        return res.status(200).json({
            success: true,
            message: "KYC submitted successfully",
            data: kyc,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};





module.exports = { submitKYC };
