const axios = require("axios");
const crypto = require("crypto");
const Pairs = require("../../models/pairs");
const Assets = require("../../models/assets");
const { get24HrTicker } = require("../auth/services/binanceService");
// const { getAssetFromDB } = require("../auth/assests_network/assets");



const getBinanceData = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);

    const response = await axios.get(
      "https://api.binance.com/api/v3/ticker/24hr",
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
        timeout: 5000,
      }
    );

    if (!Array.isArray(response.data)) {
      return res.status(502).json({
        success: false,
        result: null,
        message: "Invalid response from Binance",
      });
    }

    /*  1. FILTER ONLY USDT PAIRS */
    const usdtPairs = response.data.filter((item) =>
      item.symbol.endsWith("USDT")
    );

    /*  2. PAGINATE AFTER FILTERING */
    const total = usdtPairs.length;
    const startIndex = (page - 1) * limit;
    const paginatedData = usdtPairs.slice(
      startIndex,
      startIndex + limit
    );

    return res.status(200).json({
      success: true,
      result: {
        page,
        limit,
        total,
        data: paginatedData,
      },
      message: "Binance USDT data fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching Binance data:", error.message);

    return res.status(500).json({
      success: false,
      result: null,
      message: "Failed to fetch Binance data",
    });
  }
};


//Main net
// const API_KEY = process.env.BINANCE_API_KEY;
// const SECRET_KEY = process.env.BINANCE_API_SECRET;

//Test net
const API_KEY = process.env.TESTNET_API_KEY;
const SECRET_KEY = process.env.TESTNET_SECRET_KEY;

const BASE_URL = "https://testnet.binance.vision";
// const BASE_URL = "https://demo-fapi.binance.com";


// const BASE_URL = "https://api.binance.com";

const RECV_WINDOW = 5000;

// reusable signed GET request
async function binanceSignedGet(endpoint, params = {}) {
  try {
    const unsignedEndpoints = [
      "/api/v3/exchangeInfo",
      "/api/v3/depth",
      "/api/v3/ticker/24hr",
      "/api/v3/ticker/price",
      "/api/v3/ticker/bookTicker",
      "/api/v3/time"
    ];

    const isUnsigned = unsignedEndpoints.some(e => endpoint.startsWith(e));

    if (isUnsigned) {
      const queryString = new URLSearchParams(params).toString();
      const url = `${BASE_URL}${endpoint}${queryString ? "?" + queryString : ""}`;
      const response = await axios.get(url, {
        headers: { "X-MBX-APIKEY": API_KEY }
      });
      return response.data;
    }

    // 2. Signed request for account/private data
    const serverTime = Date.now();
    const queryParams = {
      ...params,
      timestamp: String(serverTime),
    };

    const queryString = new URLSearchParams(queryParams).toString();
    const signature = crypto
      .createHmac("sha256", SECRET_KEY)
      .update(queryString)
      .digest("hex");

    const url = `${BASE_URL}${endpoint}?${queryString}&signature=${signature}`;
    const response = await axios.get(url, {
      headers: { "X-MBX-APIKEY": API_KEY }
    });

    return response.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
}

async function binanceGet(endpoint, params = {}) {
  try {
    //  get Binance server time
    // const timeRes = await axios.get(`${BASE_URL}/api/v3/time`);
    // const serverTime = timeRes.data.serverTime;
    const serverTime = Date.now();

    // const serverTime = Date.now();
    //  build query params
    const queryParams = {
      ...params,
      timestamp: String(serverTime),
      // recvWindow: RECV_WINDOW,
    };

    const queryString = new URLSearchParams(queryParams).toString();

    //  create signature
    const signature = crypto
      .createHmac("sha256", SECRET_KEY)
      .update(queryString)
      .digest("hex");

    //  final URL
    const url = `${BASE_URL}${endpoint}?${queryString}&signature=${signature}`;
    // console.log(url, "urlurl")
    //  call Binance
    const response = await axios.get(url, {
      headers: {
        "X-MBX-APIKEY": API_KEY,
      },
    });
    // console.log(response.data, "responseresponse");

    return response.data;

  } catch (err) {
    throw err.response?.data || err.message;
    console.log(err);
  }
}

// reusable signed POST request
async function binancePost(endpoint, params = {}) {
  try {
    const serverTime = Date.now();

    const bodyParams = {
      ...params,
      timestamp: serverTime,
    };

    const queryString = new URLSearchParams(bodyParams).toString();

    const signature = crypto
      .createHmac("sha256", SECRET_KEY)
      .update(queryString)
      .digest("hex");

    // Append signature to body
    const finalBody = `${queryString}&signature=${signature}`;

    const response = await axios.post(
      `${BASE_URL}${endpoint}`,
      finalBody,
      {
        headers: {
          "X-MBX-APIKEY": API_KEY,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return response.data;

  } catch (err) {
    throw err.response?.data || err.message;
  }
}

async function binanceDelete(endpoint, params = {}) {
  try {
    const serverTime = Date.now();

    const bodyParams = {
      ...params,
      timestamp: serverTime,
    };

    const queryString = new URLSearchParams(bodyParams).toString();

    const signature = crypto
      .createHmac("sha256", SECRET_KEY)
      .update(queryString)
      .digest("hex");

    const finalQuery = `${queryString}&signature=${signature}`;

    const response = await axios.delete(
      `${BASE_URL}${endpoint}?${finalQuery}`,
      {
        headers: {
          "X-MBX-APIKEY": API_KEY,
        },
      }
    );

    return response.data;

  } catch (err) {
    throw err.response?.data || err.message;
  }
}

const createSpotOrder = async (req, res) => {
  try {
    const { symbol, side, type, quantity, price, stopPrice } = req.body;

    if (!symbol || !side || !type || !quantity) {
      return res.status(400).json({
        success: false,
        message: "symbol, side, type, and quantity are required",
      });
    }

    const params = {
      symbol: symbol.toUpperCase(),
      side: side.toUpperCase(),
      type: type.toUpperCase(),
      quantity: quantity.toString(),
    };

    if (type.toUpperCase() === "LIMIT") {
      if (!price) {
        return res.status(400).json({
          success: false,
          message: "price is required for LIMIT orders",
        });
      }
      params.price = price.toString();
      params.timeInForce = "GTC"; // Good Til Cancelled
    }

    if (stopPrice) {
      params.stopPrice = stopPrice.toString();
    }

    const data = await binancePost("/api/v3/order", params);

    return res.status(200).json({
      success: true,
      result: data,
      message: "Order placed successfully",
    });
  } catch (err) {
    console.error("Error creating spot order:", err);
    return res.status(500).json({
      success: false,
      error: err,
    });
  }
};


// async function binanceGet(endpoint, params = {}) {
//   const timestamp = Date.now();

//   const queryParams = {
//     ...params,
//     timestamp,
//     recvWindow: RECV_WINDOW,
//   };

//   const queryString = new URLSearchParams(queryParams).toString();

//   const signature = crypto
//     .createHmac("sha256", SECRET_KEY)
//     .update(queryString)
//     .digest("hex");

//   const url = `${BASE_URL}${endpoint}?${queryString}&signature=${signature}`;

//   const response = await axios.get(url, {
//     headers: { "X-MBX-APIKEY": API_KEY },
//   });

//   return response.data;
// }

// 🔹 get balances
// async function getAccountBalances() {
//   const data = await binanceGet("/api/v3/account");
//   return data.balances;
// }

// // 🔹 get asset names
// async function getAssetDetails() {
//   return await binanceGet("/sapi/v1/asset/assetDetail");
// }

// 🔹 GET all asset configurations (coin info)
const getAssetConfig = async () => {
  try {
    const data = await binanceGet("/sapi/v1/capital/config/getall");
    return data;
  } catch (err) {
    throw err;
  }
};

// const getAssetFromDB = async () => {
//   try {
//     const data = await Assets.find().lean()
//       .populate("networkIds.networkId");
//     return data;
//   } catch (err) {
//     throw err;
//   }
// };

//  GET account balances with asset names from capital/config/getall
//  GET account balances with asset names from capital/config/getall
// const getAccountBalancesWithAssetInfo = async (req, res) => {
//   try {
//     const page = Math.max(parseInt(req.query.page) || 1, 1);
//     const limit = Math.max(parseInt(req.query.limit) || 10, 1);
//     const search = (req.query.search || "").toLowerCase();
//     const hideLow = req.query.hideLow === "true";

//     const [balances, assetConfig] = await Promise.all([
//       (async () => {
//         const data = await binanceGet("/api/v3/account");
//         return data.balances;
//       })(),
//       getAssetConfig(),
//     ]);

//     // Create a map of asset info for quick lookup
//     const assetInfoMap = {};
//     if (Array.isArray(assetConfig)) {
//       assetConfig.forEach((asset) => {
//         assetInfoMap[asset.coin] = {
//           name: asset.name || asset.coin,
//           icon: asset.iconUrl || "",
//           isLegalMoney: asset.isLegalMoney || false,
//           tradingType: asset.tradingType || "",
//         };
//       });
//     }

//     // Merge, Filter (Search + hideLow), and then Paginate
//     const filteredBalances = balances
//       .map((balance) => ({
//         asset: balance.asset,
//         name: assetInfoMap[balance.asset]?.name || balance.asset,
//         icon: assetInfoMap[balance.asset]?.icon || "",
//         free: balance.free,
//         locked: balance.locked,
//         total: (parseFloat(balance.free) + parseFloat(balance.locked)).toString(),
//       }))
//       .filter((item) => {
//         // Search Filter
//         const matchesSearch = item.asset.toLowerCase().includes(search) ||
//           item.name.toLowerCase().includes(search);

//         // Low Balance Filter (threshold 0.0001)
//         const isNotLow = hideLow ? parseFloat(item.total) > 0.0001 : true;

//         return matchesSearch && isNotLow;
//       });

//     const totalAssets = filteredBalances.length;
//     const totalPages = Math.ceil(totalAssets / limit);
//     const startIndex = (page - 1) * limit;
//     const paginatedBalances = filteredBalances.slice(startIndex, startIndex + limit);

//     return res.status(200).json({
//       success: true,
//       result: {
//         balances: paginatedBalances,
//         totalAssets,
//         totalPages,
//         currentPage: page,
//         limit,
//       },
//       message: "Paginated account balances fetched successfully",
//     });
//   } catch (err) {
//     console.error("Error fetching balances:", err);
//     return res.status(500).json({
//       success: false,
//       error: err.message || "Internal server error",
//     });
//   }
// };

const getAccountBalancesWithAssetInfo = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const search = (req.query.search || "").toLowerCase();
    const hideLow = req.query.hideLow === "true";

    const [balances, assetsFromDB] = await Promise.all([
      binanceGet("/api/v3/account").then(data => data.balances),
      Assets.find().lean().populate("networkIds.networkId")
    ]);

    // Map asset info from DB for quick lookup
    const assetInfoMap = {};
    if (Array.isArray(assetsFromDB)) {
      assetsFromDB.forEach(asset => {
        assetInfoMap[asset.symbol] = {
          name: asset.assetname || asset.symbol,
          icon: asset.image || "",
          // isLegalMoney: asset.isLegalMoney || false,
          // tradingType: asset.tradingType || "",
        };
      });
    }

    // Merge + Filter
    const filteredBalances = balances
      .map(balance => {
        const total =
          parseFloat(balance.free || 0) + parseFloat(balance.locked || 0);

        return {
          asset: balance.asset,
          name: assetInfoMap[balance.asset]?.name || balance.asset,
          icon: assetInfoMap[balance.asset]?.icon || "",
          free: balance.free,
          locked: balance.locked,
          total, // keep as number for sorting
        };
      })
      .filter(item => {
        const matchesSearch =
          item.asset.toLowerCase().includes(search) ||
          item.name.toLowerCase().includes(search);

        const isNotLow = hideLow ? item.total > 0.0001 : true;

        return matchesSearch && isNotLow;
      })
      //  SORT: High → Low
      .sort((a, b) => b.total - a.total);

    // Pagination
    const totalAssets = filteredBalances.length;
    const totalPages = Math.ceil(totalAssets / limit);
    const startIndex = (page - 1) * limit;
    const paginatedBalances = filteredBalances
      .slice(startIndex, startIndex + limit)
      .map(item => ({
        ...item,
        total: item.total.toString(), // convert back to string if needed
      }));

    return res.status(200).json({
      success: true,
      result: {
        totalAssets,
        totalPages,
        currentPage: page,
        limit,
        balances: paginatedBalances,
      },
      message: "Paginated account balances fetched successfully",
    });
  } catch (err) {
    console.error("Error fetching balances:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};


const getPairsFromAssetConfig = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/v3/exchangeInfo`, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      timeout: 5000,
    });
    return response.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};




// // New API: market data with pagination and USDT filter
// const getBinanceMarketData = async (req, res) => {
//   try {
//     const page = Math.max(parseInt(req.query.page) || 1, 1);
//     const limit = Math.max(parseInt(req.query.limit) || 10, 1);

//     //  Get all pairs from Binance exchangeInfo
//     const exchangeInfo = await getPairsFromAssetConfig();
//     if (!exchangeInfo?.symbols || !Array.isArray(exchangeInfo.symbols)) {
//       return res.status(502).json({
//         success: false,
//         result: null,
//         message: "Invalid exchange info from Binance",
//       });
//     }

//     //  Filter only USDT pairs
//     const usdtPairs = exchangeInfo.symbols
//       .map((s) => s.symbol)
//       .filter((symbol) => symbol.endsWith("USDT"));

//     if (usdtPairs.length === 0) {
//       return res.status(200).json({
//         success: true,
//         result: { page, limit, total: 0, data: [] },
//         message: "No USDT pairs found",
//       });
//     }

//     // Get Binance 24hr ticker data
//     const tickerResponse = await axios.get(`${BASE_URL}/api/v3/ticker/24hr`, {
//       headers: { "User-Agent": "Mozilla/5.0" },
//       timeout: 5000,
//     });

//     if (!Array.isArray(tickerResponse.data)) {
//       return res.status(502).json({
//         success: false,
//         result: null,
//         message: "Invalid ticker data from Binance",
//       });
//     }

//     //  Filter ticker data by USDT pairs
//     const filteredData = tickerResponse.data.filter((ticker) =>
//       usdtPairs.includes(ticker.symbol)
//     );

//     //  Paginate the filtered data
//     const total = filteredData.length;
//     const startIndex = (page - 1) * limit;
//     const paginatedData = filteredData.slice(startIndex, startIndex + limit);

//     //  Send response
//     return res.status(200).json({
//       success: true,
//       result: { page, limit, total, data: paginatedData },
//       message: "Binance USDT market data fetched successfully",
//     });
//   } catch (error) {
//     console.error("Error fetching Binance market data:", error.message);
//     return res.status(500).json({
//       success: false,
//       result: null,
//       message: "Failed to fetch Binance market data",
//     });
//   }
// };

// your DB model for pairs

const getBinanceMarketData = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);

    //  Get all active USDT pairs from DB
    const dbPairs = await Pairs.find({ status: true, quoteAsset: "USDT" });
    const dbSymbols = dbPairs.map((p) => p.symbol);

    if (dbSymbols.length === 0) {
      return res.status(200).json({
        success: true,
        result: { page, limit, total: 0, data: [] },
        message: "No active USDT pairs in database",
      });
    }

    //  Get Binance 24hr ticker data
    const response = await axios.get("https://api.binance.com/api/v3/ticker/24hr", {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 5000,
    });
    // const response = await get24HrTicker();

    if (!Array.isArray(response.data)) {
      return res.status(502).json({
        success: false,
        result: null,
        message: "Invalid ticker data from Binance",
      });
    }

    //  Filter Binance data for DB symbols
    const filteredData = response.data.filter((ticker) =>
      dbSymbols.includes(ticker.symbol)
    );

    //  Paginate filtered data
    const total = filteredData.length;
    const startIndex = (page - 1) * limit;
    const paginatedData = filteredData.slice(startIndex, startIndex + limit);

    //  Attach DB pair details
    const dataWithDetails = paginatedData.map((ticker) => {
      const dbPair = dbPairs.find((p) => p.symbol === ticker.symbol);

      return {
        // ...ticker,
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
        stepSize: dbPair.stepSize,
        tickSize: dbPair.tickSize,
        exchange: dbPair.exchange,

      };
    });

    //  Send response
    return res.status(200).json({
      success: true,
      result: { page, limit, total, data: dataWithDetails },
      message: "Binance USDT market data fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching Binance market data:", error.message);
    return res.status(500).json({
      success: false,
      result: null,
      message: "Failed to fetch Binance market data",
    });
  }
};




const getTopPairs = async (req, res) => {
  try {
    // Get active USDT pairs from DB
    const dbPairs = await Pairs.find({ status: true, quoteAsset: "USDT" });
    const dbSymbols = dbPairs.map((p) => p.symbol);

    if (!dbSymbols.length) {
      return res.status(200).json({
        success: true,
        result: {
          trending: { total: 0, data: [] },
          topGainers: { total: 0, data: [] },
          topLosers: { total: 0, data: [] },
        },
        message: "No active USDT pairs",
      });
    }

    // Binance 24hr ticker
    const { data } = await axios.get(
      "https://api.binance.com/api/v3/ticker/24hr",
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 5000,
      }
    );

    if (!Array.isArray(data)) {
      return res.status(502).json({
        success: false,
        result: null,
        message: "Invalid ticker data from Binance",
      });
    }

    //  Filter only DB symbols
    const filtered = data
      .filter((t) => dbSymbols.includes(t.symbol))
      .map((ticker) => {
        const dbPair = dbPairs.find((p) => p.symbol === ticker.symbol);

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
          stepSize: dbPair.stepSize,
          tickSize: dbPair.tickSize,
          exchange: dbPair.exchange,
        };
      });

    //  Top Gainers
    const topGainers = [...filtered]
      .sort((a, b) => b.priceChangePercent - a.priceChangePercent)
      .slice(0, 3);

    // 5️⃣ Top Losers
    const topLosers = [...filtered]
      .sort((a, b) => a.priceChangePercent - b.priceChangePercent)
      .slice(0, 3);

    //  Trending (Binance-like logic)
    // High volume + movement (NOT same as gainers)
    const trending = [...filtered]
      .sort(
        (a, b) =>
          b.quoteVolume * Math.abs(b.priceChangePercent) -
          a.quoteVolume * Math.abs(a.priceChangePercent)
      )
      .slice(0, 3);

    //  Final response (consistent with your market API)
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
      message: "Top USDT pairs fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching top pairs:", error.message);
    return res.status(500).json({
      success: false,
      result: null,
      message: "Failed to fetch top pairs",
    });
  }
};

const getPairBalances = async (req, res) => {
  try {
    const { pair } = req.query;

    if (!pair || !pair.includes("/")) {
      return res.status(400).json({
        success: false,
        message: "Pair is required in format BTC/USDT",
      });
    }

    const [baseAsset, quoteAsset] = pair.split("/");

    // Fetch Binance balances + asset DB data together
    const [accountData, assetsFromDB] = await Promise.all([
      binanceGet("/api/v3/account"),
      Assets.find().lean()
    ]);

    const balances = accountData.balances;

    // Convert DB assets into map for quick lookup
    const assetInfoMap = {};
    assetsFromDB.forEach(asset => {
      assetInfoMap[asset.symbol] = {
        name: asset.assetname || asset.symbol,
        icon: asset.image || "",
      };
    });

    // Helper function
    const formatBalance = (symbol) => {
      const balance = balances.find(b => b.asset === symbol);

      if (!balance) {
        return {
          asset: symbol,
          name: assetInfoMap[symbol]?.name || symbol,
          icon: assetInfoMap[symbol]?.icon || "",
          free: "0",
          locked: "0",
          total: "0",
        };
      }

      const free = parseFloat(balance.free || 0);
      const locked = parseFloat(balance.locked || 0);
      const total = free + locked;

      return {
        asset: symbol,
        name: assetInfoMap[symbol]?.name || symbol,
        icon: assetInfoMap[symbol]?.icon || "",
        free: balance.free,
        locked: balance.locked,
        total: total.toString(),
      };
    };

    const baseBalance = formatBalance(baseAsset);
    const quoteBalance = formatBalance(quoteAsset);

    return res.status(200).json({
      success: true,
      result: {
        pair,
        baseAsset: baseBalance,
        quoteAsset: quoteBalance,
      },
      message: "Pair balances fetched successfully",
    });

  } catch (error) {
    console.error("Error fetching pair balances:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};






module.exports = {
  getBinanceData,
  binanceGet,
  binancePost,
  binanceDelete,
  getAssetConfig,
  getAccountBalancesWithAssetInfo,
  getPairsFromAssetConfig,
  getBinanceMarketData,
  getTopPairs,
  createSpotOrder,
  getPairBalances,
  binanceSignedGet
};

