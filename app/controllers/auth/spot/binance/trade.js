const { binancePost, binanceDelete, binanceSignedGet } = require("../../binanceApi");
const Pairs = require("../../../../models/pairs")


const hasValidPrecision = (value, allowedDecimals) => {
  const str = Number(value).toString();
  if (!str.includes(".")) return true;
  const decimals = str.split(".")[1];
  return decimals.length <= allowedDecimals;
};

const formatToPrecision = (value, decimals) => {
  return Number(value).toFixed(decimals);
};

const getFriendlyErrorMessage = (errorData) => {
  const msg = errorData.msg || errorData.message || "";

  if (msg.includes("Filter failure: PERCENT_PRICE")) {
    return "Price is too far from current market price. Please adjust your price closer to the market.";
  }
  if (msg.includes("Filter failure: LOT_SIZE") || msg.includes("Filter failure: MARKET_LOT_SIZE")) {
    return "The quantity entered is invalid. Please check the minimum/maximum limits.";
  }
  if (msg.includes("Filter failure: MIN_NOTIONAL")) {
    return "The total order value is too small. Please increase the amount or price.";
  }
  if (msg.includes("Filter failure: PRICE_FILTER")) {
    return "The price is invalid for this pair. Please adjust the price precision.";
  }
  if (msg.includes("Account has insufficient balance")) {
    return "Insufficient balance to place this order.";
  }

  if (errorData.code === -2010) return "Insufficient balance or invalid order.";
  if (errorData.code === -1013) return "The order value or quantity is below the minimum required.";
  if (errorData.code === -1102) return "A required parameter was missing or invalid.";

  return msg || "Order placement failed. Please check your inputs.";
};

const createSpotOrder = async (req, res) => {
  try {
    let { symbol, side, type, quantity, quoteOrderQty, price, stopPrice, timeInForce = "GTC" } = req.body;

    // ─────────────────────────────
    //  Basic Required Fields
    // ─────────────────────────────
    if (!symbol || !side || !type) {
      return res.status(400).json({
        success: false,
        message: "symbol, side and type are required",
      });
    }

    symbol = symbol.toUpperCase();
    side = side.toUpperCase();
    type = type.toUpperCase();

    const nQuantity = quantity ? parseFloat(quantity) : undefined;
    const nQuoteOrderQty = quoteOrderQty ? parseFloat(quoteOrderQty) : undefined;
    const nPrice = price ? parseFloat(price) : undefined;
    const nStopPrice = stopPrice ? parseFloat(stopPrice) : undefined;

    const allowedSides = ["BUY", "SELL"];
    const allowedTypes = [
      "MARKET",
      "LIMIT",
      "STOP_LOSS",
      "STOP_LOSS_LIMIT",
      "TAKE_PROFIT",
      "TAKE_PROFIT_LIMIT",
      "LIMIT_MAKER",
    ];

    if (!allowedSides.includes(side)) {
      return res.status(400).json({
        success: false,
        message: "Invalid side",
      });
    }

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order type",
      });
    }

    // ─────────────────────────────
    //  Fetch Pair From DB
    // ─────────────────────────────
    const pair = await Pairs.findOne({ symbol });

    if (!pair || pair.status === false) {
      return res.status(400).json({
        success: false,
        message: "Trading pair not supported",
      });
    }

    // ─────────────────────────────
    //  Quantity / QuoteOrderQty Validation
    // ─────────────────────────────
    if (type === "MARKET" && side === "BUY" && nQuoteOrderQty) {
      // Validating quoteOrderQty
      if (nQuoteOrderQty <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid total is required",
        });
      }
      if (pair.minNotional > 0 && nQuoteOrderQty < pair.minNotional) {
        return res.status(400).json({
          success: false,
          message: `Minimum order value is ${pair.minNotional}`,
        });
      }
    } else {
      // Validating quantity
      if (!nQuantity || nQuantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid quantity is required",
        });
      }

      if (nQuantity < pair.minQty) {
        return res.status(400).json({
          success: false,
          message: `Minimum quantity is ${pair.minQty}`,
        });
      }

      if (pair.maxQty > 0 && nQuantity > pair.maxQty) {
        return res.status(400).json({
          success: false,
          message: `Maximum quantity is ${pair.maxQty}`,
        });
      }

      if (!hasValidPrecision(nQuantity, pair.stepSize)) {
        return res.status(400).json({
          success: false,
          message: `Quantity supports max ${pair.stepSize} decimals`,
        });
      }
    }

    // ─────────────────────────────
    //  Price Validation (if applicable)
    // ─────────────────────────────
    if (["LIMIT", "STOP_LOSS_LIMIT", "TAKE_PROFIT_LIMIT", "LIMIT_MAKER"].includes(type)) {
      if (!nPrice || nPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid price is required",
        });
      }

      if (nPrice < pair.minPrice || (pair.maxPrice > 0 && nPrice > pair.maxPrice)) {
        return res.status(400).json({
          success: false,
          message: `Price must be between ${pair.minPrice} and ${pair.maxPrice}`,
        });
      }

      if (!hasValidPrecision(nPrice, pair.tickSize)) {
        return res.status(400).json({
          success: false,
          message: `Price supports max ${pair.tickSize} decimals`,
        });
      }
    }

    // ─────────────────────────────
    //  Stop Price Validation
    // ─────────────────────────────
    if (["STOP_LOSS", "STOP_LOSS_LIMIT", "TAKE_PROFIT", "TAKE_PROFIT_LIMIT"].includes(type)) {
      if (!nStopPrice || nStopPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid stopPrice is required",
        });
      }

      if (!hasValidPrecision(nStopPrice, pair.tickSize)) {
        return res.status(400).json({
          success: false,
          message: `Stop price supports max ${pair.tickSize} decimals`,
        });
      }
    }

    // ─────────────────────────────
    //  Notional Check (only if not already checked for quoteOrderQty)
    // ─────────────────────────────
    if (!(type === "MARKET" && side === "BUY" && nQuoteOrderQty)) {
      let notional = 0;

      if (type === "MARKET") {
        const ticker = await binanceSignedGet("/api/v3/ticker/price", { symbol });
        notional = parseFloat(ticker.price) * nQuantity;
      } else {
        notional = nPrice * nQuantity;
      }

      if (pair.minNotional > 0 && notional < pair.minNotional) {
        return res.status(400).json({
          success: false,
          message: `Minimum order value is ${pair.minNotional}`,
        });
      }
    }

    // ─────────────────────────────
    //  Prepare Binance Params
    // ─────────────────────────────
    const params = {
      symbol,
      side,
      type,
    };

    if (type === "MARKET" && side === "BUY" && nQuoteOrderQty) {
      params.quoteOrderQty = formatToPrecision(nQuoteOrderQty, pair.tickSize);
    } else {
      params.quantity = formatToPrecision(nQuantity, pair.stepSize);
    }

    if (["LIMIT", "STOP_LOSS_LIMIT", "TAKE_PROFIT_LIMIT", "LIMIT_MAKER"].includes(type)) {
      params.price = formatToPrecision(nPrice, pair.tickSize);
      params.timeInForce = timeInForce;
    }

    if (["STOP_LOSS", "STOP_LOSS_LIMIT", "TAKE_PROFIT", "TAKE_PROFIT_LIMIT"].includes(type)) {
      params.stopPrice = formatToPrecision(nStopPrice, pair.tickSize);
    }

    // ─────────────────────────────
    //  Place Order
    // ─────────────────────────────
    const data = await binancePost("/api/v3/order", params);

    return res.status(200).json({
      success: true,
      result: {
        orderId: data.orderId,
        symbol: data.symbol,
        status: data.status,
        type: data.type,
        side: data.side,
        price: data.price,
        originalQuantity: data.origQty,
        executedQty: data.executedQty,
      },
      message: "Order placed successfully",
    });

  } catch (err) {
    const errorData = err?.response?.data || err;
    console.error("Spot Order Error:", errorData);

    const errorMessage = getFriendlyErrorMessage(errorData);

    return res.status(400).json({
      success: false,
      message: errorMessage,
      original_msg: errorData.msg || errorData.message,
      error_code: errorData.code
    });
  }
};

const getOrderHistory = async (req, res) => {
  try {
    const { symbol, limit = 50, page = 1, startTime, endTime, orderId } = req.query;

    if (!symbol) {
      return res.status(400).json({ success: false, message: "symbol is required" });
    }

    const params = {
      symbol: symbol.toUpperCase(),
      limit: Math.min(parseInt(limit), 1000),
    };

    if (startTime) params.startTime = startTime;
    if (endTime) params.endTime = endTime;
    if (orderId) params.orderId = orderId;

    let data = await binanceSignedGet("/api/v3/allOrders", params);

    // Simple manual pagination since Binance doesn't support 'page' directly
    const pageSize = parseInt(limit);
    const currentPage = parseInt(page);
    const totalItems = data.length;

    // If user provided a page > 1, we slice the data (Note: this only works within the fetched limit)
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedData = data.slice(startIndex, startIndex + pageSize);

    return res.status(200).json({
      success: true,
      result: {
        data: paginatedData,
        total: paginatedData.length,
        count: totalItems,
        page: currentPage,
        limit: pageSize,
      },
      message: "Order history fetched successfully"
    });

  } catch (err) {
    console.error("Get Order History Error:", err?.response?.data || err.message);
    return res.status(400).json({
      success: false,
      error: err?.response?.data?.msg || err?.msg || err?.message || "Failed to fetch order history",
    });
  }
};

const getOpenOrders = async (req, res) => {
  try {
    const { symbol } = req.query;

    const params = {};
    if (symbol) {
      params.symbol = symbol.toUpperCase();
    }

    const data = await binanceSignedGet("/api/v3/openOrders", params);

    

    return res.status(200).json({
      success: true,
      result: {
        data: data,
        total: data.length,
        count: data.length
      },
      message: "Open orders fetched successfully"
    });

  } catch (err) {
    console.error("Get Open Orders Error:", err?.response?.data || err.message);
    return res.status(400).json({
      success: false,
      error: err?.response?.data?.msg || err?.msg || err?.message || "Failed to fetch open orders",
    });
  }
};

const getMyTradesHistory = async (req, res) => {
  try {
    const { symbol, limit = 50, page = 1, startTime, endTime, fromId } = req.query;

    if (!symbol) {
      return res.status(400).json({ success: false, message: "symbol is required" });
    }

    const params = {
      symbol: symbol.toUpperCase(),
      limit: Math.min(parseInt(limit), 1000),
    };

    if (startTime) params.startTime = startTime;
    if (endTime) params.endTime = endTime;
    if (fromId) params.fromId = fromId;

    const data = await binanceSignedGet("/api/v3/myTrades", params);

    const pageSize = parseInt(limit);
    const currentPage = parseInt(page);
    const totalItems = data.length;
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedData = data.slice(startIndex, startIndex + pageSize);

    return res.status(200).json({
      success: true,
      result: {
        data: paginatedData,
        total: paginatedData.length, 
        count: totalItems,           
        page: currentPage,
        limit: pageSize,
      },
      message: "Trade history fetched successfully",
    });

  } catch (err) {
    console.error("Get Trades Error:", err?.response?.data || err.message);
    return res.status(400).json({
      success: false,
      error: err?.response?.data?.msg || err?.msg || err?.message || "Failed to fetch trades history",
    });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { symbol, orderId, origClientOrderId } = req.body;

    if (!symbol || (!orderId && !origClientOrderId)) {
      return res.status(400).json({
        success: false,
        message: "symbol and orderId or origClientOrderId are required",
      });
    }

    const cancelParams = {
      symbol: symbol.toUpperCase()
    };
    if (orderId) cancelParams.orderId = orderId;
    if (origClientOrderId) cancelParams.origClientOrderId = origClientOrderId;

    const data = await binanceDelete("/api/v3/order", cancelParams);

    return res.status(200).json({
      success: true,
      result: data,
      message: "Order cancelled successfully",
    });

  } catch (err) {
    console.error("Cancel Order Error:", err?.response?.data || err.message);
    return res.status(400).json({
      success: false,
      error: err?.response?.data?.msg || err?.msg || err?.message || "Failed to cancel order",
    });
  }
};

module.exports = { createSpotOrder, getOpenOrders, getOrderHistory, getMyTradesHistory, cancelOrder };