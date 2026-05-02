const mongoose = require("mongoose");
const ownWallet = require("../../../../models/ownWallet");
const assets = require("../../../../models/assets");
const ownWalletTransfer = require("../../../../models/ownWalletTransfer");
const { binanceGet } = require("../../binanceApi");

const transferWallet = async (req, res) => {
  try {
    const { from, to, asset, amount } = req.body;
    const userId = req.user._id;

    if (!from || !to || !asset || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "from, to, asset and positive amount are required",
      });
    }

    if (from === to) {
      return res.status(400).json({
        success: false,
        message: "From and To wallet cannot be the same",
      });
    }

    if (
      !(
        (from === "SPOT" && to === "P2P") ||
        (from === "P2P" && to === "SPOT")
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Supported transfers: SPOT → P2P or P2P → SPOT",
      });
    }

    const symbol = asset.toUpperCase();
    const parsedAmount = Number(amount);

    if (from === "SPOT" && to === "P2P") {
      const accountInfo = await binanceGet("/api/v3/account");
      const spotBalances = accountInfo.balances || [];
      const spotAsset = spotBalances.find((b) => b.asset === symbol);

      if (!spotAsset || parseFloat(spotAsset.free) < parsedAmount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient Spot balance for ${symbol}. Available: ${spotAsset?.free || 0
            }`,
        });
      }

      const assetInfo = await assets.findOne({ symbol });

      const wallet = await ownWallet.findOneAndUpdate(
        { userId, asset: symbol },
        {
          $inc: { free: parsedAmount, total: parsedAmount },
          $setOnInsert: {
            from: "SPOT",
            to: "P2P",
            name: assetInfo?.assetname || symbol,
            icon: assetInfo?.image || "",
          },
        },
        { upsert: true, new: true }
      );

      const transfer = await ownWalletTransfer.create({
        userId,
        ownWalletId: wallet._id,
        asset: symbol,
        from: "SPOT",
        to: "P2P",
        amount: parsedAmount,
      });

      return res.status(200).json({
        success: true,
        message: "Transferred from Spot to P2P successfully",
        result: wallet,
      });
    }

    if (from === "P2P" && to === "SPOT") {
      const wallet = await ownWallet.findOne({ userId, asset: symbol });

      if (!wallet || wallet.free < parsedAmount) {
        return res.status(400).json({
          success: false,
          message: "Insufficient P2P balance",
        });
      }

      wallet.free -= parsedAmount;
      wallet.total -= parsedAmount;
      if (from === "P2P") {
        wallet.from = "P2P",
          wallet.to = "SPOT"
      } else {
        wallet.from = "SPOT",
          wallet.to = "P2P"
      }

      await wallet.save();

      await ownWalletTransfer.create({
        userId,
        ownWalletId: wallet._id,
        asset: symbol,
        from: "P2P",
        to: "SPOT",
        amount: parsedAmount,
      });

      return res.status(200).json({
        success: true,
        message: "Transferred from P2P to Spot successfully",
        result: wallet,
      });
    }
  } catch (error) {
    console.error("Wallet Transfer Error:", error);
    return res.status(500).json({
      success: false,
      message: "Wallet transfer failed",
      error: error.message,
    });
  }
};


// const getP2PWallet = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const page = Math.max(parseInt(req.query.page) || 1, 1);
//     const limit = Math.max(parseInt(req.query.limit) || 10, 1);
//     const search = (req.query.search || "").toLowerCase();
//     const hideLow = req.query.hideLow === "true";

//     let query = { userId };

//     if (search) {
//       query.$or = [
//         { asset: { $regex: search, $options: "i" } },
//         { name: { $regex: search, $options: "i" } }
//       ];
//     }

//     if (hideLow) {
//       query.total = { $gt: 0.0001 };
//     }

//     const totalAssets = await ownWallet.countDocuments(query);
//     const totalPages = Math.ceil(totalAssets / limit);
//     const startIndex = (page - 1) * limit;

//     const wallets = await ownWallet
//       .find(query)
//       .sort({ total: -1 })
//       .skip(startIndex)
//       .limit(limit);

//     return res.status(200).json({
//       success: true,
//       result: {
//         totalAssets,
//         totalPages,
//         currentPage: page,
//         limit,
//         balances: wallets,
//       },
//       message: "P2P wallet balances fetched successfully",
//     });
//   } catch (error) {
//     console.error("Get P2P Wallet Error:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// };


// const getP2PWalletById = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const { asset } = req.params;

//     const wallet = await ownWallet.findOne({ userId, asset: asset.toUpperCase() });

//     if (!wallet) {
//       return res.status(404).json({ success: false, message: "Asset not found in P2P wallet" });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Asset balance fetched successfully",
//       result: wallet
//     });
//   } catch (error) {
//     console.error("Get P2P Wallet By Id Error:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// };


const getP2PWallet = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const search = (req.query.search || "").toLowerCase();
    const hideLow = req.query.hideLow === "true";

    let assetQuery = {};
    if (search) {
      assetQuery.$or = [
        { symbol: { $regex: search, $options: "i" } },
        { assetname: { $regex: search, $options: "i" } },
      ];
    }

    let walletQuery = { userId };
    if (search) {
      walletQuery = {
        $and: [
          { userId },
          {
            $or: [
              { asset: { $regex: search, $options: "i" } },
              { name: { $regex: search, $options: "i" } }
            ]
          }
        ]
      };
    }

    const [allAssets, userWallets] = await Promise.all([
      assets.find(assetQuery).lean(),
      ownWallet.find(walletQuery).lean()
    ]);
    const assetMap = {};
    allAssets.forEach(a => {
      assetMap[a.symbol.toUpperCase()] = a;
    });

    const walletMap = {};
    userWallets.forEach(w => {
      walletMap[w.asset.toUpperCase()] = w;
    });

    const symbolsToInclude = new Set([
      ...allAssets.map(a => a.symbol.toUpperCase()),
      ...userWallets.map(w => w.asset.toUpperCase())
    ]);

    let balances = Array.from(symbolsToInclude).map(symbol => {
      const asset = assetMap[symbol];
      const wallet = walletMap[symbol];

      return {
        asset: symbol,
        name: asset?.assetname || wallet?.name || symbol,
        icon: asset?.image || wallet?.icon || "",
        free: wallet ? wallet.free : 0,
        locked: wallet ? wallet.locked : 0,
        total: wallet ? wallet.total : 0,
      };
    });

    if (hideLow) {
      balances = balances.filter(b => b.total > 0.0001);
    }

    balances.sort((a, b) => {
      if (b.total !== a.total) {
        return b.total - a.total;
      }
      return a.asset.localeCompare(b.asset);
    });

    const totalAssets = balances.length;
    const totalPages = Math.ceil(totalAssets / limit);
    const startIndex = (page - 1) * limit;
    const paginatedBalances = balances.slice(startIndex, startIndex + limit);

    return res.status(200).json({
      success: true,
      message: "P2P wallet balances fetched successfully",
      result: {
        totalAssets,
        totalPages,
        currentPage: page,
        limit,
        balances: paginatedBalances,
      },
    });
  } catch (error) {
    console.error("Get P2P Wallet Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch P2P wallet balances",
      error: error.message,
    });
  }
};

const getP2PWalletById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { asset } = req.params;

    let wallet;

    if (mongoose.Types.ObjectId.isValid(asset)) {
      wallet = await ownWallet.findOne({
        _id: asset,
        userId
      });
    } else {
      const symbol = asset.toUpperCase();
      wallet = await ownWallet.findOne({
        userId,
        asset: symbol
      });

      // If not in ownWallet, check if it's a valid global asset
      if (!wallet) {
        const assetInfo = await assets.findOne({
          $or: [{ symbol }, { assetname: symbol }]
        });

        if (assetInfo) {
          wallet = {
            asset: assetInfo.symbol,
            name: assetInfo.assetname,
            icon: assetInfo.image,
            free: 0,
            locked: 0,
            total: 0,
            userId: userId
          };
        }
      }
    }

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "P2P wallet not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "P2P wallet fetched successfully",
      result: wallet
    });

  } catch (error) {
    console.error("Get P2P Wallet Error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};


// const getAccountBalances = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const page = Math.max(parseInt(req.query.page) || 1, 1);
//     const limit = Math.max(parseInt(req.query.limit) || 10, 1);
//     const search = (req.query.search || "").toLowerCase();
//     const hideLow = req.query.hideLow === "true";

//     const [balances, assetsFromDB, p2pBalances] = await Promise.all([
//       binanceGet("/api/v3/account").then((data) => data.balances || []),
//       assets.find().lean().populate("networkIds.networkId"),
//       ownWallet.find({ userId }).lean(),
//     ]);

//     // Map asset info from DB for quick lookup
//     const assetInfoMap = {};
//     if (Array.isArray(assetsFromDB)) {
//       assetsFromDB.forEach((asset) => {
//         assetInfoMap[asset.symbol] = {
//           name: asset.assetname || asset.symbol,
//           icon: asset.image || "",
//         };
//       });
//     }

//     // Map P2P balances for quick lookup
//     const p2pMap = {};
//     if (Array.isArray(p2pBalances)) {
//       p2pBalances.forEach((w) => {
//         p2pMap[w.asset] = {
//           free: w.free || 0,
//           locked: w.locked || 0,
//           total: w.total || 0,
//         };
//       });
//     }

//     // Merge Spot and P2P balances
//     // We start with Spot balances from Binance
//     const mergedList = balances.map((balance) => {
//       const spotFree = parseFloat(balance.free || 0);
//       const spotLocked = parseFloat(balance.locked || 0);
//       const spotTotal = spotFree + spotLocked;

//       const p2pAsset = p2pMap[balance.asset] || {
//         free: 0,
//         locked: 0,
//         total: 0,
//       };

//       return {
//         asset: balance.asset,
//         name: assetInfoMap[balance.asset]?.name || balance.asset,
//         icon: assetInfoMap[balance.asset]?.icon || "",
//         spotFree: spotFree.toString(),
//         spotLocked: spotLocked.toString(),
//         spotTotal,
//         p2pFree: p2pAsset.free,
//         p2pLocked: p2pAsset.locked,
//         p2pTotal: p2pAsset.total,
//         totalBalance: spotTotal + p2pAsset.total, // Combined value
//       };
//     });

//     // Also add P2P assets that might not be in Spot (rare but possible in demo)
//     p2pBalances.forEach((p2p) => {
//       if (!balances.find((b) => b.asset === p2p.asset)) {
//         mergedList.push({
//           asset: p2p.asset,
//           name: p2p.name || p2p.asset,
//           icon: p2p.icon || "",
//           spotFree: "0",
//           spotLocked: "0",
//           spotTotal: 0,
//           p2pFree: p2p.free,
//           p2pLocked: p2p.locked,
//           p2pTotal: p2p.total,
//           totalBalance: p2p.total,
//         });
//       }
//     });

//     // Filter
//     const filteredBalances = mergedList
//       .filter((item) => {
//         const matchesSearch =
//           item.asset.toLowerCase().includes(search) ||
//           item.name.toLowerCase().includes(search);

//         const isNotLow = hideLow ? item.totalBalance > 0.0001 : true;

//         return matchesSearch && isNotLow;
//       })
//       .sort((a, b) => b.totalBalance - a.totalBalance);

//     // Pagination
//     const totalAssets = filteredBalances.length;
//     const totalPages = Math.ceil(totalAssets / limit);
//     const startIndex = (page - 1) * limit;
//     const paginatedBalances = filteredBalances.slice(
//       startIndex,
//       startIndex + limit
//     );

//     return res.status(200).json({
//       success: true,
//       result: {
//         totalAssets,
//         totalPages,
//         currentPage: page,
//         limit,
//         balances: paginatedBalances,
//       },
//       message: "Paginated integrated balances fetched successfully",
//     });
//   } catch (err) {
//     console.error("Error fetching balances:", err);
//     return res.status(500).json({
//       success: false,
//       error: err.message || "Internal server error",
//     });
//   }
// };


const getTransferHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const transfers = await ownWalletTransfer.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ownWalletTransfer.countDocuments({ userId });

    return res.status(200).json({
      success: true,
      message: "Transfer history fetched successfully",
      result: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        transfers
      },
    });
  } catch (error) {
    console.error("Error fetching transfer history:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

//get all transfer history
const getAllTransferHistory = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const transfers = await ownWalletTransfer.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ownWalletTransfer.countDocuments();

    return res.status(200).json({
      success: true,
      message: "Transfer history fetched successfully",
      result: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        transfers,
      },
    });
  } catch (error) {
    console.error("Error fetching transfer history:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}
module.exports = {
  transferWallet,
  getP2PWallet,
  getP2PWalletById,
  getTransferHistory,
  getAllTransferHistory
};