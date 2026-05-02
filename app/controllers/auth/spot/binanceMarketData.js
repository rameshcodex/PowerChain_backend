const axios = require("axios");
const crypto = require("crypto");
const Pairs = require("../../../models/pairs");
const Assets = require("../../../models/assets");

const getBinanceMarketDataForSpot = async (req, res) => {
  try {
    const { quoteAsset } = req.query;

    const filter = { status: true };
    if (quoteAsset) {
      filter.quoteAsset = quoteAsset.toUpperCase();
    }

    const dbPairs = await Pairs.find(filter);

    if (!dbPairs.length) {
      return res.status(200).json({
        success: true,
        result: [],
        message: "No matching pairs found",
      });
    }

    const dbSymbols = dbPairs.map((p) => p.symbol);

    // Fetch only the symbols we have in our DB from Binance (more efficient than fetching all)
    const symbolsParam = JSON.stringify(dbSymbols);
    const response = await axios.get(
      "https://api.binance.com/api/v3/ticker/24hr",
      {
        params: { symbols: symbolsParam },
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 8000,
      }
    );

    const tickers = Array.isArray(response.data) ? response.data : [response.data];
    const pairMap = {};
    dbPairs.forEach((pair) => {
      pairMap[pair.symbol] = pair;
    });

    const filteredData = tickers.map((ticker) => {
      const dbPair = pairMap[ticker.symbol];
      if (!dbPair) return null;

      return {
        symbol: ticker.symbol,
        priceChange: Number(ticker.priceChange),
        priceChangePercent: Number(ticker.priceChangePercent),
        lastPrice: Number(ticker.lastPrice),
        highPrice: Number(ticker.highPrice),
        lowPrice: Number(ticker.lowPrice),
        volume: Number(ticker.volume),
        quoteVolume: Number(ticker.quoteVolume),

        baseAsset: dbPair.baseAsset,
        quoteAsset: dbPair.quoteAsset,
        tickSize: dbPair.tickSize,
        stepSize: dbPair.stepSize,
        minQty: dbPair.minQty,
        maxQty: dbPair.maxQty,
        minPrice: dbPair.minPrice,
        maxPrice: dbPair.maxPrice,
        minNotional: dbPair.minNotional,
        maxNotional: dbPair.maxNotional,
        exchange: dbPair.exchange,
      };
    }).filter(Boolean);

    return res.status(200).json({
      success: true,
      result: {
        total: filteredData.length,
        data: filteredData,
      },
      message: "Market data fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching Binance market data:", error.message);
    return res.status(500).json({
      success: false,
      result: null,
      message: "Failed to fetch market data",
    });
  }
};

const favoritePairs = async (req, res) => {
  try {
    const userId = req.user._id;
    const { symbol } = req.body;

    if (!symbol) {
      return res.status(400).json({ message: "symbol is required" });
    }

    const pair = await Pairs.findOne({ symbol: symbol.toUpperCase() });
    if (!pair) {
      return res.status(404).json({ message: "Pair not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.favorites) {
      user.favorites = [];
    }

    const isAlreadyFav = user.favorites.includes(symbol);

    if (isAlreadyFav) {
      user.favorites = user.favorites.filter((s) => s !== symbol);
      await user.save();
      return res.status(200).json({
        success: true,
        action: "removed",
        message: "Pair removed from favorites",
      });
    } else {
      user.favorites.push(symbol);
      await user.save();
      return res.status(200).json({
        success: true,
        action: "added",
        message: "Pair added to favorites",
      });
    }
  } catch (error) {
    console.error("Error toggling favorite:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update favorite",
    });
  }
};



const getOrderBook = async (req, res) => {
  try {
    const { symbol } = req.query;

    if (!symbol) {
      return res.status(400).json({ message: "symbol is required" });
    }

    const response = await axios.get(
      "https://api.binance.com/api/v3/depth",
      {
        params: { symbol: symbol.toUpperCase(), limit: 100 },
      }
    );

    return res.json(response.data);

  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Error fetching order book" });
  }
};



const getTickerForSymbol = async (req, res) => {
  try {
    const symbol = (req.query.symbol || "").toUpperCase().trim();

    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: "symbol query param is required",
      });
    }

    // Look up pair in DB to get tickSize / stepSize
    const dbPair = await Pairs.findOne({ symbol, status: true });

    // Fetch real-time ticker from Binance
    const response = await axios.get(
      "https://api.binance.com/api/v3/ticker/24hr",
      {
        params: { symbol },
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 5000,
      }
    );

    const t = response.data;

    const quoteRegex = /(USDT|BUSD|BTC|ETH|BNB|USDC|DAI)$/;
    const match = symbol.match(quoteRegex);
    const fallbackQuote = match ? match[1] : "USDT";
    const fallbackBase = symbol.replace(quoteRegex, "") || symbol;

    const result = {
      symbol: t.symbol,
      priceChange: Number(t.priceChange),
      priceChangePercent: Number(t.priceChangePercent),
      lastPrice: Number(t.lastPrice),
      highPrice: Number(t.highPrice),
      lowPrice: Number(t.lowPrice),
      volume: Number(t.volume),
      quoteVolume: Number(t.quoteVolume),
      baseAsset: dbPair?.baseAsset || fallbackBase,
      quoteAsset: dbPair?.quoteAsset || fallbackQuote,
      tickSize: dbPair?.tickSize ?? 2,
      stepSize: dbPair?.stepSize ?? 2,
      minQty: dbPair?.minQty ?? 0,
      maxQty: dbPair?.maxQty ?? 0,
      minPrice: dbPair?.minPrice ?? 0,
      maxPrice: dbPair?.maxPrice ?? 0,
      minNotional: dbPair?.minNotional ?? 0,
      maxNotional: dbPair?.maxNotional ?? 0,
      exchange: dbPair?.exchange || ["binance"],
    };

    return res.status(200).json({
      success: true,
      result,
      message: "Ticker fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching ticker for symbol:", error.message);
    return res.status(500).json({
      success: false,
      result: null,
      message: "Failed to fetch ticker",
    });
  }
};

module.exports = { getBinanceMarketDataForSpot, getOrderBook, getTickerForSymbol };