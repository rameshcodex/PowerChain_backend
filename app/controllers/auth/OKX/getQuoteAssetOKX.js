const PairsOKX = require("../../../models/pairsOKX");

const getQuoteAssetsOKX = async (req, res) => {
    try {
        const { type = "spot" } = req.query;
        
        const allowedQuotes = ["USDT", "USD", "USDC", "ETH"];
        const filter = {
            status: true,
            type: type.toLowerCase(),
            quoteAsset: { $in: allowedQuotes },
        };

        const quoteAssets = await PairsOKX.distinct("quoteAsset", filter);

        quoteAssets.sort((a, b) => a.localeCompare(b));

        return res.status(200).json({
            success: true,
            result: {
                total: quoteAssets.length,
                data: quoteAssets,
            },
            message: "Quote assets fetched successfully",
        });
    } catch (error) {
        console.error("getQuoteAssetsOKX error:", error.message);

        return res.status(500).json({
            success: false,
            result: null,
            message: "Failed to fetch quote assets",
        });
    }
};

module.exports = { getQuoteAssetsOKX };