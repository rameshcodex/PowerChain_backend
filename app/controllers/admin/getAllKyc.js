const KYC = require("../../models/kyc");
const { getItems, checkQueryString } = require("../../middleware/db");
const { handleError } = require("../../middleware/utils");

/**
 * Get all KYC with pagination and filters
 */
const getAllKYC = async (req, res) => {
    try {
        const query = await checkQueryString(req.query);
        const { status, search } = req.query;

        if (status) query.status = status;
        if (search) query.$or = [{ firstName: { $regex: search, $options: "i" } }, { lastName: { $regex: search, $options: "i" } }, { middleName: { $regex: search, $options: "i" } }];
        const kycs = await getItems(req, KYC, query)

        res.status(200).json({ success: true, result: kycs, message: "KYCs fetched successfully" });
    } catch (error) {
        handleError(res, error);
    }
};


module.exports = {
    getAllKYC
};