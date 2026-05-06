const axios = require("axios");
const PairsOKX = require("../../../models/pairsOKX");
const { handleError } = require("../../../middleware/utils");

const OKX_BASE_URL = process.env.OKX_API_URL || "https://www.okx.com";

const getTopPairsOKX = async (req, res) => {
  try {
    const { type = "spot" } = req.query;

    const pairType = type.toLowerCase();
    const instType = pairType === "future" ? "FUTURES" : "SPOT";

    // get active USDT pairs
    const dbPairs = await PairsOKX.find({
      status: true,
      type: pairType,
      quoteAsset: "USDT",
    })
      .select("symbol baseAsset quoteAsset tickSize stepSize exchange")
      .lean();

    if (!dbPairs.length) {
      return res.status(200).json({
        success: true,
        result: {
          trending: { total: 0, data: [] },
          topGainers: { total: 0, data: [] },
          topLosers: { total: 0, data: [] },
        },
        message: "No active USDT pairs found",
      });
    }

    const pairMap = new Map(
      dbPairs.map((pair) => [pair.symbol, pair])
    );

    // OKX ticker API
    const { data } = await axios.get(
      `${OKX_BASE_URL}/api/v5/market/tickers`,
      {
        params: { instType },
        timeout: 5000,
      }
    );

    const tickers = data?.data || [];

    // filter DB symbols only
    const filtered = tickers
      .filter((ticker) => pairMap.has(ticker.instId))
      .map((ticker) => {
        const dbPair = pairMap.get(ticker.instId);

        const last = Number(ticker.last || 0);
        const open24h = Number(ticker.open24h || 0);
        const priceChange = Number((last - open24h).toFixed(2));
        const priceChangePercent = open24h
          ? Number(((priceChange / open24h) * 100).toFixed(2))
          : 0;

        return {
          symbol: ticker.instId,
          priceChange,
          priceChangePercent,
          lastPrice: last,
          highPrice: Number(ticker.high24h || 0),
          lowPrice: Number(ticker.low24h || 0),
          volume: Number(ticker.vol24h || 0),
          quoteVolume: Number(ticker.volCcy24h || 0),

          baseAsset: dbPair.baseAsset,
          quoteAsset: dbPair.quoteAsset,
          stepSize: dbPair.stepSize,
          tickSize: dbPair.tickSize,
          exchange: dbPair.exchange,
        };
      });

    // top gainers
    const topGainers = [...filtered]
      .sort((a, b) => b.priceChangePercent - a.priceChangePercent)
      .slice(0, 3);

    // top losers
    const topLosers = [...filtered]
      .sort((a, b) => a.priceChangePercent - b.priceChangePercent)
      .slice(0, 3);

    // trending
    const trending = [...filtered]
      .sort(
        (a, b) =>
          b.quoteVolume * Math.abs(b.priceChangePercent) -
          a.quoteVolume * Math.abs(a.priceChangePercent)
      )
      .slice(0, 3);

    return res.status(200).json({
      success: true,
      result: {
        trending: {
          total: trending.length,
          data: trending,
        },
        topGainers: {
          total: topGainers.length,
          data: topGainers,
        },
        topLosers: {
          total: topLosers.length,
          data: topLosers,
        },
      },
      message: "Top OKX pairs fetched successfully",
    });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = { getTopPairsOKX };