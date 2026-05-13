const Pairs = require("../../models/pairsOKX");
const { handleError } = require("../../middleware/utils");

const getPairById = async (req, res) => {
    try {
        const { id } = req.params || {};

        if (!id) return res.status(400).json({ success: false, message: "Pair id is required." });

        const pair = await Pairs.findById(id);

        res.status(200).json({ success: true, result: pair, message: "Pair fetched successfully." });
    } catch (error) {
        handleError(res, error);
    }
};

module.exports = { getPairById };