const axios = require("axios");
const PairsOKX = require("../../../models/pairsOKX");

const OKX_BASE_URL = process.env.OKX_API_URL || "https://www.okx.com";

const getOKXMarketData = async (req, res) => {
    try {
        const {
            quoteAsset = "USDT",
            type = "spot",
            search = "",
            page = 1,
            limit = 20,
        } = req.query;

        const currentPage = Math.max(parseInt(page) || 1, 1);
        const perPage = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
        const skip = (currentPage - 1) * perPage;

        const filter = {
            status: true,
            type: type.toLowerCase(),
            quoteAsset: quoteAsset.toUpperCase(),
        };

        // quote filter
        if (quoteAsset) {
            filter.quoteAsset = quoteAsset.toUpperCase();
        }

        // search filter
        if (search?.trim()) {
            const s = search.trim();
            const fuzzySearch = s.replace(/[-_]/g, "").split("").join("-?");

            filter.$or = [
                { symbol: { $regex: s, $options: "i" } },
                { symbol: { $regex: fuzzySearch, $options: "i" }, },
                { baseAsset: { $regex: s, $options: "i" } },
                { quoteAsset: { $regex: s, $options: "i" } },
            ];
        }

        // DB query parallel
        const [total, dbPairs] = await Promise.all([
            PairsOKX.countDocuments(filter),
            PairsOKX.find(filter)
                .select(
                    "symbol baseAsset quoteAsset tickSize stepSize minQty maxQty minPrice maxPrice minNotional maxNotional exchange type"
                )
                .skip(skip)
                .limit(perPage)
                .lean(),
        ]);

        if (!dbPairs.length) {
            return res.status(200).json({
                success: true,
                result: {
                    total: 0,
                    page: currentPage,
                    limit: perPage,
                    totalPages: 0,
                    data: [],
                },
                message: "No matching pairs found",
            });
        }

        const instType =
            type.toLowerCase() === "future" ? "FUTURES" : "SPOT";

        // OKX ticker fetch
        const { data } = await axios.get(
            `${OKX_BASE_URL}/api/v5/market/tickers`,
            {
                params: { instType },
                timeout: 5000,
            }
        );

        const tickerMap = new Map(
            (data.data || []).map((item) => [item.instId, item])
        );

        const result = dbPairs.map((pair) => {
            const ticker = tickerMap.get(pair.symbol);

            const last = Number(ticker?.last || 0);
            const open24h = Number(ticker?.open24h || 0);
            const priceChange = Number((last - open24h).toFixed(2));

            return {
                symbol: pair.symbol,
                priceChange,
                priceChangePercent: open24h
                    ? Number(((priceChange / open24h) * 100).toFixed(2))
                    : 0,
                lastPrice: last,
                highPrice: Number(ticker?.high24h || 0),
                lowPrice: Number(ticker?.low24h || 0),
                volume: Number(ticker?.vol24h || 0),
                quoteVolume: Number(ticker?.volCcy24h || 0),
                ...pair,
            };
        });

        return res.status(200).json({
            success: true,
            result: {
                total,
                page: currentPage,
                limit: perPage,
                totalPages: Math.ceil(total / perPage),
                data: result,
            },
            message: "Market data fetched successfully",
        });
    } catch (error) {
        console.error("OKX market error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch market data",
        });
    }
};

module.exports = { getOKXMarketData };