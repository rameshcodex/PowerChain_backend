const TradeConfiguration = require("../../models/tradeConfigutations");
const { handleError } = require("../../middleware/utils");

const setCommission = async (req, res) => {
    try {
        const { buyCommission, sellCommission, type } = req.body;

        if (!type) return res.status(400).json({
            success: false,
            message: "Invalid type. Must be spot or future."
        });

        const updateData = {};
        if (buyCommission) updateData.buyCommission = buyCommission;
        if (sellCommission) updateData.sellCommission = sellCommission;

        const tradeConfig = await TradeConfiguration.findOneAndUpdate({ type }, updateData, { new: true, upsert: true });

        res.status(200).json({
            success: true,
            result: tradeConfig,
            message: `Trade configuration updated successfully`
        });
    } catch (error) {
        handleError(res, error);
    }
}

module.exports = { setCommission };