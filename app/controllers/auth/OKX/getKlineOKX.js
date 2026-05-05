const axios = require("axios");

const OKX_BASE_URL = process.env.OKX_API_URL || "https://www.okx.com";

const getKlineOKX = async (req, res) => {
  try {
    const {
      symbol = "BTC-USDT",
      interval = "1m",
      limit = 100,
      before,
      after
    } = req.query;

    const params = {
        instId: symbol.toUpperCase(),
        bar: interval,
        limit,
    };
    if (before) params.before = before;
    if (after) params.after = after;

    const { data } = await axios.get(
      `${OKX_BASE_URL}/api/v5/market/history-candles`,
      {
        params,
        timeout: 5000,
      }
    );

    const candles = (data.data || []).map((c) => ({
      time: Number(c[0]),
      open: Number(c[1]),
      high: Number(c[2]),
      low: Number(c[3]),
      close: Number(c[4]),
      volume: Number(c[5]),
      quoteVolume: Number(c[6]),
    }));

    return res.status(200).json({
      success: true,
      result: candles.reverse(), // oldest -> newest
      message: "Kline fetched successfully",
    });
  } catch (error) {
    console.error("OKX Kline Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch kline data",
    });
  }
};

module.exports = { getKlineOKX };