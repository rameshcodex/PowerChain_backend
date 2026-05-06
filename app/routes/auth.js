const express = require("express");
const router = express.Router();
require('../../config/passport')
const passport = require('passport')

/** Passport JWT — used on routes that accept user or admin tokens */
const requireAuth = passport.authenticate('jwt', {
    session: false
})


const trimRequest = require('trim-request')
const { roleAuthorization } = require("../middleware/auth");


// controllers
const { register } = require("../controllers/auth/userOnboard/register.js");
const { verifyOtp } = require("../controllers/auth/userOnboard/verifyOtp.js");
const { resendOtp } = require("../controllers/auth/userOnboard/resendOtp.js");
const resetPassword = require("../controllers/auth/userOnboard/resetPassword.js");
const { forgetPassword } = require("../controllers/auth/userOnboard/forgetPassword.js")
const { verifyOtpForLoggedUsers } = require("../controllers/auth/userOnboard/verifyOtpForLoggedUsers.js");
const { refreshToken } = require("../controllers/auth/userOnboard/refreshToken.js");
const { login } = require("../controllers/auth/userOnboard/login.js");
const { getUserProfile } = require("../controllers/auth/userOnboard/getUserProfile.js");
const { adminRegister } = require("../controllers/admin/adminRegister");
const { adminLogin } = require("../controllers/admin/adminLogin");
const { generateCaptcha } = require("../middleware/utiles/generateCaptcha");
const { updateUserProfile } = require("../controllers/auth/userOnboard/updateUserProfile.js");
const { setUpTwoFA, verifyTwoFA, disableTwoFA, loginTwoFAVerify } = require("../controllers/auth/userOnboard/twofaController.js")
const { getAllTickets } = require("../controllers/admin/Ticket/getAllTickets");
const { isAdmin, isSubAdmin } = require("../middleware/auth/isAdmin");






// validators
const { forgetPasswordValidator } = require("../controllers/auth/validator/forgetPasswordValidator");
const { verifyOtpForLoggedUsersValidator } = require("../controllers/auth/validator/verifyOtpForLoggedUsersValidator");
const { verifyOtpValidator } = require("../controllers/auth/validator/verifyOtpValidator");
const { tokenValidator } = require("../middleware/auth/tokenValidator");
const { loginValidator } = require("../controllers/auth/validator/loginValidator");
const { adminRegisterValidator } = require("../controllers/admin/adminRegisterValidator");
const { registerValidator } = require("../controllers/auth/validator/registerValidator");
const { updateUserProfileValidator } = require("../controllers/auth/validator/updateUserProfileValidator")
const { resetPasswordValidator } = require("../controllers/auth/validator/resetPasswordValidator");
const { createTicketValidator } = require("../controllers/Ticket/validator/createTicketValidator");
const { createP2PPostValidator } = require("../controllers/auth/validator/p2pPostValidator");
const { submitKYCValidator } = require("../controllers/auth/validator/submitKYCValidator");


const { googleLogin } = require("../controllers/auth/userOnboard/google-login.js");
const { getBinanceData, binanceGet, getAssetConfig, getAccountBalancesWithAssetInfo, getPairsFromAssetConfig, getBinanceMarketData, getTopPairs, createSpotOrder, getPairBalances } = require("../controllers/auth/binanceApi");
const { updateProfileImage } = require("../controllers/auth/userOnboard/profileImageUploader.js");

const { createUploader } = require("../middleware/upload");

const uploadAvatar = createUploader({
    folder: "avatars",
    prefix: "avatar",
});

const uploadKYC = createUploader({
    folder: "kyc",
    prefix: "kyc",
});

const uploadP2P = createUploader({
    folder: "p2p",
    prefix: "p2p",
});
const uploadP2PPaymentImage = createUploader({
    folder: "p2p/payment-methods",
    prefix: "paymentP2P",
});
const { saveNetworksFromAssetConfig, getAllNetworks, getNetworksByChain, deleteNetwork, updateNetwork } = require("../controllers/auth/assests_network/network");
const { saveNetworkFromAssets } = require("../controllers/auth/assests_network/networks")
const { saveAssetsFromAssetConfig, getAssets, getAssestForWithdrawal } = require("../controllers/auth/assests_network/assets");
const { createWithdraw, getWithdrawHistory } = require("../controllers/auth/assests_network/withdraw.js");
const { savePairsFromAssetConfig, getPairs } = require("../controllers/auth/assests_network/pairs");
const { createTicket } = require("../controllers/Ticket/createTicket");
const { getTicketById } = require("../controllers/Ticket/getTicketById.js");
const { getAllTicketsByUserId } = require("../controllers/Ticket/getAllTicketsByUserId");
const { sendMessage } = require("../controllers/Ticket/sendMessage");
const { closeTicket } = require("../controllers/Ticket/socket/TicketMessSocket.js");
const { createP2PPost, getAllP2PPosts, getMyP2PPosts, getAllPostExpectMyPost, cancelPost, getPostById } = require("../controllers/auth/p2p/post");
// const { getAllP2PPosts, getMyP2PPosts } = require("../controllers/auth/p2p/get");
const { addPaymentMethod, getPaymentMethods, updatePaymentMethod, deletePaymentMethod, getPaymentTypes, paymentMethodStatus } = require("../controllers/auth/p2p/payment");
const { createTrade, getOrderById, getUserOrders, } = require("../controllers/auth/p2p/order.js");

const { addPaymentMethodValidator } = require("../controllers/auth/p2p/validator/addPaymentVlidator");
const { transferWallet, getP2PWallet, getP2PWalletById, getTransferHistory } = require("../controllers/auth/p2p/ownP2pWallet/P2pWallet.js");
const { createTradeOrder, uploadTradeImage, getTradeOrder, confirmPayment, releaseAssets, cancelTradeOrder, sendP2PMessage } = require("../controllers/auth/p2p/p2pPostOrder.js");
const { getNotifications, markAsRead, getUnreadCount, clearNotifications, markAllAsRead } = require("../controllers/auth/notification/notification");
const { getBinanceMarketDataForSpot, getOrderBook, getTickerForSymbol } = require("../controllers/auth/spot/binanceMarketData.js");
const { resendotpValidator } = require("../controllers/auth/validator/resendotpValidator.js");

const { submitKYC, updateKYCStatus, getKYC } = require("../controllers/auth/userOnboard");
const { getRabbitMQNotifications } = require("../controllers/auth/userOnboard/getRabbitMQNotifications");



// ...
// (routes will be added at the end or in a separate call, but I'll add them here if I replace a large block)
// I'll add them before P2P WALLET ROUTES




// const { refreshToken } = require("../controllers/auth/refreshToken");
// const validate = require("../middleware/auth/validate");
// const { handleValidation } = require('../middleware/utiles/handleValidation')
// import { resetPasswordValidator } from "../controllers/auth/validator/resetPasswordValidator";



//USER API ROUTES
router.post(
    "/register", registerValidator, register);

router.post("/verify-otp", verifyOtpValidator, verifyOtp);

router.post("/resend-otp", resendotpValidator, resendOtp);

router.post("/reset-password",
    tokenValidator,
    roleAuthorization(['user']),
    trimRequest.all,
    resetPasswordValidator,
    resetPassword
)

router.post("/forgot-password", forgetPasswordValidator, forgetPassword);

router.post("/verify-otp-for-logged-users", verifyOtpForLoggedUsersValidator, verifyOtpForLoggedUsers);

router.post("/login", loginValidator, login);

router.post("/refresh-token", refreshToken);



// userKyc API ROUTES
router.get(
    "/get-kyc",
    tokenValidator,
    roleAuthorization(['user']),
    getKYC
);

router.post(
    "/submit-kyc",
    tokenValidator,
    roleAuthorization(['user']),
    uploadKYC.any(),
    submitKYCValidator,
    submitKYC
);

router.post(
    "/admin/kyc/:kycId/status",
    tokenValidator,
    roleAuthorization(['admin', 'subadmin']),
    updateKYCStatus
);


//get notification rabbit
router.get("/get-rabbitmq-notifications",
    tokenValidator,
    roleAuthorization(['user']),
    trimRequest.all,
    getRabbitMQNotifications
);


//USER PROFILE API ROUTES
router.get("/get-profile",
    tokenValidator,
    roleAuthorization(['user']),
    trimRequest.all,
    // updateUserProfileValidator,
    getUserProfile
);

router.patch("/update-profile", requireAuth, updateUserProfileValidator, updateUserProfile)
router.patch(
    "/update-profile-image",
    requireAuth,
    updateProfileImage
);


// GOOGLE LOGIN
router.post("/auth/google-login", googleLogin);

router.post("/2fa-setup", requireAuth, setUpTwoFA);
router.post("/verify-2fa", requireAuth, verifyTwoFA);
router.post("/login/2fa-verify", requireAuth, loginTwoFAVerify);
router.post("/disable-2fa", requireAuth, disableTwoFA);

//ADMIN API ROUTES

router.post("/admin/register", adminRegisterValidator, adminRegister);

router.post("/admin/login", adminLogin)

// CAPTCHA ROUTE
router.get("/captcha", generateCaptcha)

// Binance api
router.get("/binance", getBinanceData)
router.get("/binance/account", async (req, res) => {
    try {
        const data = await binanceGet("/api/v3/account");
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err });
    }
});

//  GET open orders
router.get("/binance/open-orders", requireAuth, async (req, res) => {
    try {
        const { symbol } = req.query;
        const data = await binanceGet("/api/v3/openOrders", {
            symbol: symbol ? symbol.toUpperCase() : undefined,
        });
        res.json({ success: true, result: data });
    } catch (err) {
        res.status(500).json({ success: false, error: err });
    }
});

// GET order history
router.get("/binance/order-history", requireAuth, async (req, res) => {
    try {
        const { symbol } = req.query;
        if (!symbol) {
            return res.status(400).json({ success: false, message: "symbol is required" });
        }
        const data = await binanceGet("/api/v3/allOrders", {
            symbol: symbol.toUpperCase(),
        });
        res.json({ success: true, result: data });
    } catch (err) {
        res.status(500).json({ success: false, error: err });
    }
});

//  GET all asset configurations
router.get("/binance/asset-config", async (req, res) => {
    try {
        const data = await getAssetConfig();
        res.json({ success: true, result: data });
    } catch (err) {
        res.status(500).json({ success: false, error: err });
    }
});

//  SAVE networks from asset config to DB (skip duplicates)
router.post("/binance/save-networks", saveNetworksFromAssetConfig);
// router.post("/binance/save-networks", saveNetworkFromAssets);

// GET account balances with asset info from capital/config/getall
//wallet balance
router.get("/binance/balances-with-info", getAccountBalancesWithAssetInfo);

// Save assets from asset config to DB (skip duplicates)
router.post("/binance/save-assets", saveAssetsFromAssetConfig);
// Get All Assets
router.get("/binance/assets", getAssets);

// Get Assets for Withdrawal
router.get("/binance/assets-for-withdrawal", getAssestForWithdrawal);


//save pairs from asset config to DB (skip duplicates)
router.post("/binance/save-pairs", savePairsFromAssetConfig);
//Get All Pairs
router.get("/binance/pairs", getPairs);

//get market data with pairs & binancedata
router.get("/binance/market-data", getBinanceMarketData);
// router.get("/binance/market-data?page=1&limit=20", getBinanceMarketData);

//get trending, top and loser pairs
router.get("/binance/top-pairs", getTopPairs);


// router.get("/binance/account", async (req, res) => {
//   try {
//     //  balances
//     const balances = await getAccountBalances();

//     //  asset names
//     const assetDetails = await getAssetDetails();

//     //  merge
//     const result = balances.map(b => ({
//       asset: b.asset,
//       name: assetDetails[b.asset]?.name || b.asset,
//       free: b.free,
//       locked: b.locked,
//     }));

//     res.json(result);
//   } catch (err) {
//     res.status(500).json({
//       error: err.response?.data || err.message,
//     });
//   }
// });


//  NETWORK API ROUTES
// Get all networks
router.get("/networks", getAllNetworks);

// Get networks by chain
router.get("/networks/:chain", getNetworksByChain);

// Update network
router.patch("/networks/:id", updateNetwork);

// Delete network
router.delete("/networks/:id", deleteNetwork);


//  TICKET API ROUTES
router.post("/create-ticket", requireAuth, createTicketValidator, createTicket);
router.get("/get-ticket-by-id/:id", requireAuth, getTicketById);
router.get("/get-all-tickets-by-user", requireAuth, getAllTicketsByUserId);
router.post("/ticket/:ticketId/send-message", requireAuth, sendMessage);





//  P2P POST API ROUTES (c)
router.post("/p2p/create-post", requireAuth, createP2PPostValidator, createP2PPost);
router.get("/p2p/all-posts", getAllP2PPosts);
router.get("/p2p/my-posts", requireAuth, getMyP2PPosts);
router.get("/p2p/all-posts-except-mine", requireAuth, getAllPostExpectMyPost);
router.get("/p2p/get-post/:id", getPostById);
router.delete("/p2p/delete-post/:id", requireAuth, cancelPost);

//  P2P TRADE & CHAT ROUTES
router.post("/p2p/create-trade", requireAuth, createTrade);
router.get("/p2p/order/:id", requireAuth, getOrderById);
router.get("/p2p/my-orders", requireAuth, getUserOrders);
router.get("/p2p/order/:id", requireAuth, getOrderById);

//P2P POST ORDER 
router.post("/p2p/create-trade-order", requireAuth, createTradeOrder);
router.post("/p2p/upload-trade-image", requireAuth, uploadP2P.single("image"), uploadTradeImage);
router.get("/p2p/get-trade-order/:id", requireAuth, getTradeOrder);
router.post("/p2p/confirm-payment", requireAuth, confirmPayment);
router.post("/p2p/release-assets", requireAuth, releaseAssets);
router.post("/p2p/cancel-order", requireAuth, cancelTradeOrder);
router.post("/p2p/send-message", requireAuth, sendP2PMessage);



//  PAYMENT METHOD ROUTES (c)
router.post("/p2p/add-payment-method", requireAuth, addPaymentMethodValidator, addPaymentMethod);
router.get("/p2p/get-payment-methods", requireAuth, getPaymentMethods);
router.post("/p2p/upload-payment-image", requireAuth, uploadP2PPaymentImage.single("image"), uploadTradeImage);
router.patch("/p2p/update-payment-method/:id", requireAuth, updatePaymentMethod);
router.delete("/p2p/delete-payment-method/:id", requireAuth, deletePaymentMethod);
router.get("/p2p/get-payment-types", requireAuth, getPaymentTypes);
// router.patch("/p2p/update-payment-status", requireAuth, paymentMethodStatus);

// NOTIFICATION ROUTES
router.get("/notifications", requireAuth, getNotifications);
router.get("/notifications/unread-count", requireAuth, getUnreadCount);
// router.patch("/notifications/mark-as-read/:id", requireAuth, markAsRead);
router.patch("/notifications/mark-as-read/", requireAuth, markAsRead);
router.delete("/notifications/clear-all", requireAuth, clearNotifications);
// router.patch("/notifications/mark-all-as-read", requireAuth, markAllAsRead);

//  P2P WALLET ROUTES
router.post("/wallet/transfer", requireAuth, transferWallet);
router.get("/wallet/balances", requireAuth, getP2PWallet);
router.get("/wallet/balance/:asset", requireAuth, getP2PWalletById);
// router.get("/wallet/account-balances", requireAuth, getAccountBalances);

//  P2P TRANSFER HISTORY ROUTES
router.get("/wallet/transfer-history", requireAuth, getTransferHistory);
// router.get("/wallet/all-transfer-history", requireAuth, getAllTransferHistory);

// WITHDRAWAL ROUTES
router.post("/withdraw/create", requireAuth, createWithdraw);
router.get("/withdraw/history", requireAuth, getWithdrawHistory);


//********SPOT***********//
router.get("/binance/spot/market-data", getBinanceMarketDataForSpot);
router.get("/binance/spot/order-book", getOrderBook);
router.get("/binance/spot/ticker", getTickerForSymbol);
router.post("/binance/create-order", requireAuth, createSpotOrder);
router.get("/binance/spot/available-balances/", requireAuth, getPairBalances);






// admin Ticket
router.get("/admin/get-all-tickets", requireAuth, isAdmin, isSubAdmin, getAllTickets);
router.get("admin/close-ticket/:id", requireAuth, isAdmin, isSubAdmin, closeTicket);

module.exports = router;
