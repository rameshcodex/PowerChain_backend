const express = require("express");
const router = express.Router();

const { savePairsOKX } = require("../controllers/auth/OKX/savePairsOKX")
const { getOKXMarketData } = require("../controllers/auth/OKX/getMarketDataOKX")
const {getTopPairsOKX} = require("../controllers/auth/OKX/getTopPairsOkx")
const { getKlineOKX } = require("../controllers/auth/OKX/getKlineOKX")
const { getQuoteAssetsOKX } = require("../controllers/auth/OKX/getQuoteAssetOKX")
const { requireAuth } = require("../middleware/auth/requireAuth");
const { addFavoritePairOKX, removeFavoritePairOKX, getFavoritePairsOKX, } = require("../controllers/auth/OKX/favPairsOKX")




//SAVE OKX PAIRS
router.post("/save-pairs-okx", savePairsOKX);

router.get("/market-data-okx", getOKXMarketData);

// GET OKX Trending,Top Gainers,Top Losers PAIRS
router.get("/top-pairs-okx", getTopPairsOKX);
router.get("/kline-okx", getKlineOKX);
router.get("/quote-assets-okx", getQuoteAssetsOKX);

//Fav Pairs
router.post("/add-fav-pair-okx", requireAuth, addFavoritePairOKX);
router.post("/remove-fav-pair-okx", requireAuth, removeFavoritePairOKX);
router.get("/get-fav-pair-okx", requireAuth, getFavoritePairsOKX);


module.exports = router;