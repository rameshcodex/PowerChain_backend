const express = require("express");
const binanceRoute = express.Router();
const { requireAuth } = require("../middleware/auth/requireAuth");
const { createSpotOrder, getOpenOrders, getOrderHistory, getMyTradesHistory, cancelOrder } = require("../controllers/auth/spot/binance/trade");


binanceRoute.post("/create-trade-order", createSpotOrder); //
binanceRoute.get("/get-open-trade-order", getOpenOrders);//
binanceRoute.get("/get-trade-order-history", getOrderHistory);//
binanceRoute.get("/get-my-trades-history", getMyTradesHistory);//
binanceRoute.post("/cancel-trade-order", cancelOrder);


module.exports = binanceRoute