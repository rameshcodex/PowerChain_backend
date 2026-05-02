const assets = require("../../../models/assets");
const Pairs = require("../../../models/pairs");
const { getPairsFromAssetConfig } = require("../binanceApi");

// 🔹 Save pairs from Binance API (create or update using bulkWrite)
// const savePairsFromAssetConfig = async (req, res) => {
//     try {
//         const data = await getPairsFromAssetConfig();

//         if (!data || !Array.isArray(data.symbols) || data.symbols.length === 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: "No pairs data received",
//             });
//         }

//         const bulkOperations = [];
//         const assetsMap = [];

//         for (const pair of data.symbols) {
//             try {
//                 // Get filters safely
//                 const priceFilter = pair.filters?.find((f) => f.filterType === "PRICE_FILTER") || {};
//                 const lotFilter = pair.filters?.find((f) => f.filterType === "LOT_SIZE") || {};
//                 const minNotionalFilter = pair.filters?.find((f) => f.filterType === "MIN_NOTIONAL") || {};
//                 const maxNotionalFilter = pair.filters?.find((f) => f.filterType === "MAX_NOTIONAL") || {};

//                 const getPrecision = (tickSize) => {
//                     if (!tickSize || Number(tickSize) === 0) return 0;

//                     const tickStr = tickSize.toString();

//                     if (!tickStr.includes(".")) return 0;

//                     const decimals = tickStr.split(".")[1];

//                     // find position of first non-zero digit
//                     for (let i = 0; i < decimals.length; i++) {
//                         if (decimals[i] !== "0") {
//                             return i + 1;
//                         }
//                     }

//                     return 0;
//                 };

//                 // const trading = trading;
//                 const isSpotTradingAllowed = pair.isSpotTradingAllowed;
//                 const isMarginTradingAllowed = pair.isMarginTradingAllowed

//                 if (pair.status !== "TRADING" || !isSpotTradingAllowed || !isMarginTradingAllowed) {
//                      setStatus = false;
//                 } else {
//                      setStatus = true;
//                 }


//                 bulkOperations.push({
//                     updateOne: {
//                         filter: { symbol: pair.symbol },
//                         update: {
//                             $set: {
//                                 symbol: pair.symbol,
//                                 status: setStatus,
//                                 baseAsset: pair.baseAsset,
//                                 baseAssetPrecision: pair.baseAssetPrecision,
//                                 quoteAsset: pair.quoteAsset,
//                                 quoteAssetPrecision: pair.quoteAssetPrecision,
//                                 minPrice: parseFloat(priceFilter.minPrice) || 0,
//                                 maxPrice: parseFloat(priceFilter.maxPrice) || 0,
//                                 tickSize: getPrecision(priceFilter.tickSize) || 0,
//                                 minQty: parseFloat(lotFilter.minQty) || 0,
//                                 maxQty: parseFloat(lotFilter.maxQty) || 0,
//                                 stepSize: getPrecision(lotFilter.stepSize) || 0,
//                                 minNotional: parseFloat(minNotionalFilter.minNotional) || 0,
//                                 maxNotional: parseFloat(maxNotionalFilter.maxNotional) || 0,
//                                 exchange:["binance"]
//                             },
//                         },
//                         upsert: true,
//                     },
//                 });
//                 assetsMap.push({
//                     symbol: pair.symbol,
//                     assetname: pair.baseAsset
//                 })
//             } catch (error) {
//                 console.warn(`Error processing pair ${pair.symbol}:`, error.message);
//             }
//         }

//         if (bulkOperations.length === 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: "No valid pairs data found",
//             });
//         }

//         // Execute bulkWrite
//         const bulkResult = await Pairs.bulkWrite(bulkOperations, {
//             ordered: false,
//         });

//         const created = bulkResult.upsertedCount || 0;
//         const updated = bulkResult.modifiedCount || 0;
//         const total = bulkOperations.length;


//         const savedAssets = assetsMap.slice(0, created).map(n => ({ ...n, status: "created" }));
//         const upadatedAssets = assetsMap.slice(created, created + updated).map(n => ({ ...n, status: "updated" }));


//         return res.status(200).json({
//             success: true,
//             result: {
//                 created,
//                 updated,
//                 total,

//             },
//             message: `Successfully created ${created} pairs, updated ${updated} pairs`,
//         });

//     } catch (error) {
//         console.error("Error saving pairs:", error);
//         console.error("Error message:", error.message);
//         console.error("Error stack:", error.stack);
//         return res.status(500).json({
//             success: false,
//             result: null,
//             message: "Failed to save pairs",
//             error: error.message,
//             details: error.message || JSON.stringify(error),
//         });
//     }
// };

const savePairsFromAssetConfig = async (req, res) => {
    try {
        const data = await getPairsFromAssetConfig();

        if (!data?.symbols?.length) {
            return res.status(400).json({
                success: false,
                message: "No pairs data received",
            });
        }

        const bulkOperations = [];

        for (const pair of data.symbols) {
            try {
                const priceFilter = pair.filters?.find(f => f.filterType === "PRICE_FILTER") || {};
                const lotFilter = pair.filters?.find(f => f.filterType === "LOT_SIZE") || {};
                const minNotionalFilter = pair.filters?.find(f => f.filterType === "MIN_NOTIONAL") || {};
                const maxNotionalFilter = pair.filters?.find(f => f.filterType === "MAX_NOTIONAL") || {};

                const getPrecision = (tickSize) => {
                    if (!tickSize || Number(tickSize) === 0) return 0;
                    const decimals = tickSize.toString().split(".")[1];
                    if (!decimals) return 0;

                    for (let i = 0; i < decimals.length; i++) {
                        if (decimals[i] !== "0") return i + 1;
                    }
                    return 0;
                };

                // ✅ FIXED STATUS
                const setStatus =
                    pair.status === "TRADING" &&
                    pair.isSpotTradingAllowed;

                bulkOperations.push({
                    updateOne: {
                        filter: { symbol: pair.symbol },
                        update: {
                            $set: {
                                symbol: pair.symbol,
                                status: setStatus,
                                baseAsset: pair.baseAsset,
                                baseAssetPrecision: pair.baseAssetPrecision,
                                quoteAsset: pair.quoteAsset,
                                quoteAssetPrecision: pair.quoteAssetPrecision,
                                minPrice: parseFloat(priceFilter.minPrice) || 0,
                                maxPrice: parseFloat(priceFilter.maxPrice) || 0,
                                tickSize: getPrecision(priceFilter.tickSize),
                                minQty: parseFloat(lotFilter.minQty) || 0,
                                maxQty: parseFloat(lotFilter.maxQty) || 0,
                                stepSize: getPrecision(lotFilter.stepSize),
                                minNotional: parseFloat(minNotionalFilter.minNotional) || 0,
                                maxNotional: parseFloat(maxNotionalFilter.maxNotional) || 0,
                                exchange: ["binance"]
                            }
                        },
                        upsert: true,
                    }
                });

            } catch (error) {
                console.warn(`Error processing pair ${pair.symbol}:`, error.message);
            }
        }

        if (!bulkOperations.length) {
            return res.status(400).json({
                success: false,
                message: "No valid pairs data found",
            });
        }

        const bulkResult = await Pairs.bulkWrite(bulkOperations, { ordered: false });

        return res.status(200).json({
            success: true,
            result: {
                created: bulkResult.upsertedCount || 0,
                updated: bulkResult.modifiedCount || 0,
                total: bulkOperations.length,
            },
            message: `Successfully synced pairs`
        });

    } catch (error) {
        console.error("Error saving pairs:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to save pairs",
            error: error.message,
        });
    }
};

const getPairs = async (req, res) => {
    try {
        const pairs = await Pairs.find();
        return res.status(200).json({
            success: true,
            result: {
                total: pairs.length,
                data: pairs,
            },
            message: "Pairs fetched successfully",
        });
    } catch (error) {
        console.error("Error fetching pairs:", error.message);
        return res.status(500).json({
            success: false,
            result: null,
            message: "Failed to fetch pairs",
        });
    }
};

module.exports = { savePairsFromAssetConfig, getPairs };