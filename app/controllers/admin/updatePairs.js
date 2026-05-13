const Pairs = require("../../models/pairsOKX");
const { handleError } = require("../../middleware/utils");
const { matchedData } = require("express-validator");

const updatePairs = async (req, res) => {
    try {
        const data = matchedData(req);
        const { id } = req.params;

        if (!id) return res.status(400).json({ success: false, message: "Pair id is required." });

        const result = await Pairs.findByIdAndUpdate(id, data, { new: true });

        return res.status(200).json({
            success: true,
            message: "Pairs updated successfully",
            modifiedCount: result
        });
    } catch (error) {
        handleError(res, error);
    }
};

module.exports = { updatePairs };