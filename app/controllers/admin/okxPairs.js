const OkxPair = require("../../models/pairsOKX");
const { handleError } = require("../../middleware/utils");
const { getItems, checkBodyString } = require("../../middleware/db");

/**
 * Get all OKX pairs with pagination and filters
 */
const getAllOkxPairs = async (req, res) => {
    try {
        const body = req.body || {};
        const query = await checkBodyString(body);
        const status = body.status; // 'active' or 'inactive'
        const type = body.type; // 'spot' or 'future'
        const search = body.search || "";

        if (status === 'active') query.status = true;
        if (status === 'inactive') query.status = false;
        
        if (type) query.type = type;

        // Custom search implementation for OKX pairs
        if (search.trim()) {
            const searchRegex = { $regex: search.trim(), $options: "i" };
            query.$or = [
                { symbol: searchRegex },
                { baseAsset: searchRegex },
                { quoteAsset: searchRegex }
            ];
        }

        res.status(200).json(await getItems(req, OkxPair, query));
    } catch (error) {
        handleError(res, error);
    }
};



/**
 * Update OKX pairs status (single, multiple, or all)
 */
const updateOkxPairStatus = async (req, res) => {
    try {
        const status = checkBodyString(req, "status");
        const ids = checkBodyString(req, "ids");
        const all = checkBodyString(req, "all");
        const type = checkBodyString(req, "type");
        const id = checkBodyString(req, "id");

        // Determine the boolean status
        const isActive = status === 'active' || status === true;

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
