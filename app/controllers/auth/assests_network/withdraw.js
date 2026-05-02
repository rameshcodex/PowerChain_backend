const WithdrawRequest = require("../../../models/WithdrawRequest");
const OwnWallet = require("../../../models/ownWallet");
const Assets = require("../../../models/assets");
const AssetNetwork = require("../../../models/network");
const Notification = require("../../../models/notification");

// Create Withdrawal Request
const createWithdraw = async (req, res) => {
    try {
        const { asset, networkId, address, amount } = req.body;
        const userId = req.user._id;

        if (!asset || !networkId || !address || !amount) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const withdrawAmount = parseFloat(amount);
        if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
            return res.status(400).json({ success: false, message: "Invalid amount" });
        }

        // 1. Get Asset Details & Network Config
        const assetDetails = await Assets.findOne({ symbol: asset });
        if (!assetDetails) {
            return res.status(404).json({ success: false, message: "Asset not found" });
        }

        const networkConfig = assetDetails.networkIds.find(
            (n) => n.networkId.toString() === networkId
        );

        if (!networkConfig) {
            return res.status(400).json({ success: false, message: "Invalid network selection" });
        }

        const fee = networkConfig.withdrawalFees || 0;
        const minWithdraw = networkConfig.minWithDraw || 0;

        if (withdrawAmount < minWithdraw) {
            return res.status(400).json({
                success: false,
                message: `Minimum withdrawal amount is ${minWithdraw} ${asset}`
            });
        }

        // 2. Check User Balance
        const userWallet = await OwnWallet.findOne({ userId, asset });
        if (!userWallet) {
            return res.status(400).json({ success: false, message: "User wallet not found" });
        }

        // Check if user has enough "free" balance
        if (userWallet.free < withdrawAmount) {
            return res.status(400).json({ success: false, message: "Insufficient balance" });
        }

        // 3. Process Deduction
        userWallet.free -= withdrawAmount;
        userWallet.total -= withdrawAmount;
        await userWallet.save();

        // 4. Create Withdrawal Record
        const networkObj = await AssetNetwork.findById(networkId);
        const networkName = networkObj ? networkObj.networkName : "Unknown";

        const newWithdrawal = new WithdrawRequest({
            userId,
            asset,
            network: networkName,
            address,
            amount: withdrawAmount,
            fee,
            status: "pending",
        });

        await newWithdrawal.save();

        // 5. Create Notification
        const notification = new Notification({
            user: userId,
            type: "fund",
            event: "withdrawal_initiated",
            title: "Withdrawal Initiated",
            message: `Your withdrawal of ${withdrawAmount} ${asset} via ${networkName} has been initiated.`,
            isRead: false,
        });
        await notification.save();

        res.status(200).json({
            success: true,
            message: "Withdrawal request submitted successfully",
            data: newWithdrawal,
        });

    } catch (error) {
        console.error("Withdraw Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Get Withdrawal History
const getWithdrawHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const { asset, from, to } = req.query;

        let query = { userId };

        if (asset) {
            query.asset = asset.toUpperCase();
        }

        if (from || to) {
            query.createdAt = {};
            if (from) {
                query.createdAt.$gte = new Date(from);
            }
            if (to) {
                // Set 'to' date to end of day if it's just a date string, or handle as given
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);
                query.createdAt.$lte = toDate;
            }
        }

        const history = await WithdrawRequest.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: history.length, data: history });
    } catch (error) {
        console.error("Get Withdraw History Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = { createWithdraw, getWithdrawHistory };