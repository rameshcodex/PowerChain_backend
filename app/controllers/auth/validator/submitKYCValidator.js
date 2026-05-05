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

const getIdentificationValue = (body, key) => {
    const identification = parseJsonField(body.identification, {});

    return (
        body[key] ||
        identification[key] ||
        getNestedField(body, "identification", key)
    );
};

const sendValidationError = (res, message) => {
    return res.status(400).json({
        success: false,
        result: null,
        message,
    });
};

const parseDateOnly = (value) => {
    if (!value) return null;

    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return null;

    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
};

const todayDateOnly = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const adultDobLimitDateOnly = () => {
    const now = new Date();
    return new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
};

const submitKYCValidator = (req, res, next) => {
    const {
        firstName,
        lastName,
        gender,
        dob,
        dateOfBirth,
        nationality,
        phone,
        phoneNumber,
        selectedDoc,
        documentType,
        selectIDType,
    } = req.body;

    if (!firstName?.trim()) {
        return sendValidationError(res, "First name is required");
    }

    if (!lastName?.trim()) {
        return sendValidationError(res, "Last name is required");
    }

    if (!["male", "female", "Male", "Female"].includes(gender)) {
        return sendValidationError(res, "Gender is required");
    }

    const submittedDob = dob || dateOfBirth;

    if (!submittedDob) {
        return sendValidationError(res, "Date of birth is required");
    }

    const parsedDob = parseDateOnly(submittedDob);
    if (!parsedDob) {
        return sendValidationError(res, "Date of birth is invalid");
    }

    if (parsedDob > todayDateOnly()) {
        return sendValidationError(res, "Date of birth cannot be in the future");
    }

    if (parsedDob > adultDobLimitDateOnly()) {
        return sendValidationError(res, "You must be at least 18 years old");
    }

    if (!nationality?.trim()) {
        return sendValidationError(res, "Nationality is required");
    }

    if (!(phone || phoneNumber)) {
        return sendValidationError(res, "Phone number is required");
    }

    if (phone && phone.length < 10) {
        return sendValidationError(res, "Phone number must be at least 10 digits");
    }

    if (phone && phone.length > 10) {
        return sendValidationError(res, "Phone number cannot exceed 10 digits");
    }

    if (phoneNumber && phoneNumber.length < 10) {
        return sendValidationError(res, "Phone number must be at least 10 digits");
    }

    if (phoneNumber && phoneNumber.length > 10) {
        return sendValidationError(res, "Phone number cannot exceed 10 digits");
    }

    const address = parseJsonField(req.body.address, {});
    const building =
        address.building ||
        address.buildingno ||
        getNestedField(req.body, "address", "building") ||
        getNestedField(req.body, "address", "buildingno") ||
        req.body.building ||
        req.body.buildingno;
    const street = address.street || getNestedField(req.body, "address", "street") || req.body.street;
    const city = address.city || getNestedField(req.body, "address", "city") || req.body.city;
    const state = address.state || getNestedField(req.body, "address", "state") || req.body.state;
    const country =
        address.country ||
        address.residence ||
        getNestedField(req.body, "address", "country") ||
        getNestedField(req.body, "address", "residence") ||
        req.body.country ||
        req.body.residence;
    const landmark = address.landmark || getNestedField(req.body, "address", "landmark") || req.body.landmark;

    if (!building?.trim()) return sendValidationError(res, "Building number is required");
    if (!street?.trim()) return sendValidationError(res, "Street name is required");
    if (!city?.trim()) return sendValidationError(res, "City is required");
    if (!state?.trim()) return sendValidationError(res, "State is required");
    if (!country?.trim()) return sendValidationError(res, "Country is required");
    if (!landmark?.trim()) return sendValidationError(res, "Landmark is required");

    const chosenDocument = selectedDoc || documentType || selectIDType;

    if (!["passport", "national_id", "driving_license"].includes(chosenDocument)) {
        return sendValidationError(res, "Please choose a valid document type");
    }

    const idNumber =
        getIdentificationValue(req.body, "idNumber") ||
        getIdentificationValue(req.body, "idenditynumber");
    const expiryDate =
        getIdentificationValue(req.body, "expiryDate") ||
        getIdentificationValue(req.body, "dateofexpiry");

    if (!idNumber?.trim()) {
        return sendValidationError(res, "ID number is required");
    }

    if (!expiryDate) {
        return sendValidationError(res, "Expiry date is required");
    }

    const parsedExpiryDate = parseDateOnly(expiryDate);
    if (!parsedExpiryDate) {
        return sendValidationError(res, "Expiry date is invalid");
    }

    if (parsedExpiryDate < todayDateOnly()) {
        return sendValidationError(res, "Expiry date cannot be in the past");
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
        return sendValidationError(res, "Passport document image is required");
    }

    if (chosenDocument === "national_id" && (!nationalFrontFile || !nationalBackFile)) {
        return sendValidationError(res, "National ID front and back images are required");
    }

    if (chosenDocument === "driving_license" && !drivingLicenseFile) {
        return sendValidationError(res, "Driving license document image is required");
    }

    next();
};

module.exports = { submitKYCValidator };
