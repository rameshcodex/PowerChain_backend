const User = require("../../../models/user");
const PairsOKX = require("../../../models/pairsOKX");

const addFavoritePairOKX = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { symbol, type = "spot" } = req.body;
        const field = type.toLowerCase() === "future" ? "futureFavoritePairsOKX" : "favoritePairsOKX";

        if (!symbol) {
            return res.status(400).json({
                success: false,
                message: "symbol is required",
            });
        }

        const pair = await PairsOKX.findOne({
            symbol: symbol.toUpperCase(),
            type: type.toLowerCase(),
            status: true,
        }).lean();

        if (!pair) {
            return res.status(404).json({
                success: false,
                message: "Pair not found",
            });
        }

        // Use req.user.constructor to handle both User and Admin models
        await req.user.constructor.updateOne(
            { _id: userId },
            {
                $addToSet: {
                    [field]: symbol.toUpperCase(),
                },
            }
        );

        return res.status(200).json({
            success: true,
            message: "Pair added to favorites",
        });
    } catch (error) {
        console.error("addFavoritePairOKX error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to add favorite",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const removeFavoritePairOKX = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { symbol, type = "spot" } = req.body;
        const field = type.toLowerCase() === "future" ? "futureFavoritePairsOKX" : "favoritePairsOKX";

        if (!symbol) {
            return res.status(400).json({
                success: false,
                message: "symbol is required",
            });
        }

        await req.user.constructor.updateOne(
            { _id: userId },
            {
                $pull: {
                    [field]: symbol.toUpperCase(),
                },
            }
        );

        return res.status(200).json({
            success: true,
            message: "Pair removed from favorites",
        });
    } catch (error) {
        console.error("removeFavoritePairOKX error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to remove favorite",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const getFavoritePairsOKX = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { type = "spot" } = req.query;
        const field = type.toLowerCase() === "future" ? "futureFavoritePairsOKX" : "favoritePairsOKX";

        // Use the instance to find favorites directly if available, or just use findById on the model
        const user = await req.user.constructor.findById(userId)
            .select(field)
            .lean();

        const favorites = user?.[field] || [];

        if (!favorites.length) {
            return res.status(200).json({
                success: true,
                result: {
                    total: 0,
                    data: [],
                },
                message: "No favorite pairs",
            });
        }

        const pairs = await PairsOKX.find({
            symbol: { $in: favorites },
            status: true,
        })
            .select(
                "symbol type baseAsset quoteAsset tickSize stepSize minQty maxQty minPrice maxPrice minNotional maxNotional exchange"
            )
            .lean();

        return res.status(200).json({
            success: true,
            result: {
                total: pairs.length,
                data: pairs,
            },
            message: "Favorite pairs fetched successfully",
        });
    } catch (error) {
        console.error("getFavoritePairsOKX error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch favorites",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    addFavoritePairOKX,
    removeFavoritePairOKX,
    getFavoritePairsOKX,
};