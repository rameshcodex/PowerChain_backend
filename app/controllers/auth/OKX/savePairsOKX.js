const axios = require("axios");
const PairsOKX = require("../../../models/pairsOKX");
require("dotenv").config();
const { getDecimalPrecision } = require("../helpers.js");
const { handleError } = require("../../../middleware/utils");

const OKX_BASE_URL = process.env.OKX_API_URL || "https://www.okx.com";

const mapPair = (item, type) => {
    let baseAsset = "";
    let quoteAsset = "";

    // SPOT -> BTC-USDT
    // FUTURE -> BTC-USD-260529
    if (type === "spot") {
        baseAsset = item.baseCcy || item.instId.split("-")[0];
        quoteAsset = item.quoteCcy || item.instId.split("-")[1];
    } else {
        // for futures use family / underlying
        const family = item.instFamily || item.uly || item.instId;
        const parts = family.split("-");

        baseAsset = parts[0] || "";
        quoteAsset = parts[1] || "";
    }

    return {
        symbol: item.instId,
        type,
        status: item.state === "live",

        baseAsset,
        baseAssetPrecision: 8,

        quoteAsset,
        quoteAssetPrecision: 8,

        // keep strings for precision safety
        minPrice: item.tickSz || "0",
        maxPrice: item.maxLmtAmt || "0",
        tickSize: getDecimalPrecision(item.tickSz) || "0",

        minQty: item.minSz || "0",
        maxQty: item.maxLmtSz || item.maxMktSz || "0",
        stepSize: getDecimalPrecision(item.lotSz) || "0",

        minNotional: item.minSz || "0",
        maxNotional: item.maxLmtAmt || "0",

        exchange: ["OKX"],
    };
};

const savePairsOKX = async (req, res) => {
    try {
        const [spotRes, futureRes] = await Promise.all([
            axios.get(`${OKX_BASE_URL}/api/v5/public/instruments?instType=SPOT`),
            axios.get(`${OKX_BASE_URL}/api/v5/public/instruments?instType=FUTURES`),
        ]);

        const allPairs = [
            ...(spotRes.data.data || []).map((item) => mapPair(item, "spot")),
            ...(futureRes.data.data || []).map((item) => mapPair(item, "future")),
        ];

        if (!allPairs.length) {
            return res.json({
                success: true,
                message: "No pairs found",
                total: 0,
            });
        }

        const bulkOperations = allPairs.map((pair) => ({
            updateOne: {
                filter: {
                    symbol: pair.symbol,
                    type: pair.type,
                },
                update: {
                    $set: pair,
                },
                upsert: true,
            },
        }));

        const result = await PairsOKX.bulkWrite(bulkOperations, {
            ordered: false,
        });

        return res.json({
            success: true,
            total: allPairs.length,
            matched: result.matchedCount || 0,
            modified: result.modifiedCount || 0,
            inserted: result.upsertedCount || 0,
        });
    } catch (error) {
        handleError(res, error);
    }
};

module.exports = { savePairsOKX };