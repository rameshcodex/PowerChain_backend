const OkxPair = require("../../models/pairsOKX");
const { handleError } = require("../../middleware/utils");
const { getItems, checkQueryString } = require("../../middleware/db");

/**
 * Get all OKX pairs with pagination and filters
 */
const getAllOkxPairs = async (req, res) => {
    try {
        const data = req.body || {};
        const { status = 'true', type } = data;
        const query = await checkQueryString(data);

        if (status === true || status === 'true') query.status = true;
        if (status === false || status === 'false') query.status = false;

        if (type) query.type = type;
        const pairs = await getItems(req, OkxPair, query);

        res.status(200).json({ success: true, result: pairs, message: "Pairs fetched successfully." });
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * Update OKX pairs status (single, multiple, or all)
 */
const updateOkxPairStatus = async (req, res) => {
    try {
        const { status, ids, all, type, id } = req.body;

        // Determine the boolean status
        const isActive = status === true || status === 'true' || status === 'active';

        let query = {};
        let message = "";

        if (all) {
            if (type) {
                query.type = type;
                message = `All ${type} pairs status updated to ${isActive ? 'active' : 'inactive'}`;
            } else {
                message = `All pairs status updated to ${isActive ? 'active' : 'inactive'}`;
            }
        } else if (Array.isArray(ids) && ids.length > 0) {
            query._id = { $in: ids };
            message = `${ids.length} pairs updated to ${isActive ? 'active' : 'inactive'}`;
        } else if (id) {
            query._id = id;
            message = `Pair status updated successfully`;
        } else {
            return res.status(400).json({
                success: false,
                message: "Please provide pair ID(s) or set 'all' to true"
            });
        }

        const result = await OkxPair.updateMany(query, { $set: { status: isActive } });

        return res.status(200).json({
            success: true,
            message: message,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        handleError(res, error);
    }
};

module.exports = {
    getAllOkxPairs,
    updateOkxPairStatus
};
