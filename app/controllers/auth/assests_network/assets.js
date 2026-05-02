const Assets = require("../../../models/assets");
const Network = require("../../../models/network");
const { getAssetConfig, getAccountBalancesWithAssetInfo, binanceGet } = require("../binanceApi");

const buildAssetImageUrl = (symbol = "") => {
  const assetURL = String(symbol || "").trim().toUpperCase();
  if (!assetURL) return "";
  return `https://bin.bnbstatic.com/static/assets/logos/${assetURL}.png`;
};

const assetsImage = async (req, res) => {
  try {
    const { symbol } = req.body;
    const assetURL = String(symbol || "").trim().toUpperCase();

    if (!assetURL) {
      return res.status(400).json({
        success: false,
        message: "Symbol is required",
      });
    }

    const imageUrl = buildAssetImageUrl(assetURL);

    const updated = await Assets.findOneAndUpdate(
      { symbol: normalized },
      { $set: { image: imageUrl } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    return res.status(200).json({
      success: true,
      result: {
        symbol: updated.symbol,
        image: updated.image,
      },
      message: "Asset image updated successfully",
    });
  } catch (error) {
    console.error("Error updating asset image:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update asset image",
      error: error.message,
    });
  }
};

const saveAssetsFromAssetConfig = async (req, res) => {
  try {
    console.log("saveAssetsFromAssetConfig");

    const assetConfigData = await getAssetConfig();

    if (!Array.isArray(assetConfigData) || assetConfigData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No asset config data received",
      });
    }

    const savedAssets = [];
    const updatedAssets = [];
    const skippedAssets = [];
    const errors = [];

    for (const asset of assetConfigData) {
      try {
        if (!Array.isArray(asset.networkList) || asset.networkList.length === 0) {
          skippedAssets.push({
            assetname: asset.coin,
            reason: "No networks available",
          });
          continue;
        }

        const existingAsset = await Assets.findOne({ symbol: asset.coin });

        const networkIds = [];

        for (const networkData of asset.networkList) {
          try {
            const network = await Network.findOneAndUpdate(
              { networkName: networkData.network },
              {
                $set: {
                  networkName: networkData.network,
                  networkSymbol: asset.coin,
                  chain: asset.coin,
                  depositEnable: !!networkData.depositEnable,
                  withdrawEnable: !!networkData.withdrawEnable,
                  status: true,
                  addressRegex: networkData.addressRegex || "",
                  memoRegex: networkData.memoRegex || "",
                  constractAddressUrl: networkData.contractAddressUrl || "",
                  exchange: ["binance"],
                },
              },
              { upsert: true, new: true }
            );

            networkIds.push({
              networkId: network._id,
              contractAddress: networkData.contractAddress || "",
              withdrawalFees: Number(networkData.withdrawFee) || 0,
              minWithDraw: Number(networkData.withdrawMin) || 0,
              minDeposit: Number(networkData.depositDust) || 0,
              maxWithDraw: Number(networkData.withdrawMax) || 0,
            });
          } catch (err) {
            errors.push({
              asset: asset.coin,
              network: networkData.network,
              error: err.message,
            });
          }
        }

        if (!networkIds.length) {
          skippedAssets.push({
            assetname: asset.coin,
            reason: "No valid networks",
          });
          continue;
        }

        const assetPayload = {
          assetname: asset.name,
          symbol: asset.coin,
          DepositStatus: !!asset.depositAllEnable,
          WithdrawalStatus: !!asset.withdrawAllEnable,
          networkIds,
          image: buildAssetImageUrl(asset.coin),
          status: !!asset.trading,
          exchange: ["binance"],
        };

        if (!existingAsset) {
          const created = await Assets.create(assetPayload);
          savedAssets.push({
            assetname: created.assetname,
            symbol: created.symbol,
          });
        } else {
          const isDifferent =
            existingAsset.assetname !== assetPayload.assetname ||
            existingAsset.DepositStatus !== assetPayload.DepositStatus ||
            existingAsset.WithdrawalStatus !== assetPayload.WithdrawalStatus ||
            existingAsset.status !== assetPayload.status ||
            JSON.stringify(existingAsset.networkIds) !== JSON.stringify(networkIds);

          if (isDifferent) {
            await Assets.updateOne(
              { _id: existingAsset._id },
              { $set: assetPayload }
            );

            updatedAssets.push({
              assetname: asset.coin,
              updatedNetworks: networkIds.length,
            });
          } else {
            skippedAssets.push({
              assetname: asset.coin,
              reason: "No changes detected",
            });
          }
        }

      } catch (err) {
        errors.push({
          asset: asset.coin,
          error: err.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      result: {
        created: savedAssets.length,
        updated: updatedAssets.length,
        skipped: skippedAssets.length,
        errors: errors.length,
        details: {
          savedAssets,
          updatedAssets,
          skippedAssets,
          errors,
        },
      },
      message: `Created: ${savedAssets.length}, Updated: ${updatedAssets.length}, Skipped: ${skippedAssets.length}`,
    });

  } catch (error) {
    console.error("Error saving assets:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save assets",
      error: error.message,
    });
  }
};

//working version
// const saveAssetsFromAssetConfig = async (req, res) => {

//     try {
//         console.log("saveAssetsFromAssetConfig");

//         const assetConfigData = await getAssetConfig();

//         if (!Array.isArray(assetConfigData) || assetConfigData.length === 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: "No asset config data received",
//             });
//         }

//         const savedAssets = [];
//         const skippedAssets = [];
//         const errors = [];

//         for (const asset of assetConfigData) {
//             try {
//                 if (!Array.isArray(asset.networkList) || asset.networkList.length === 0) {
//                     skippedAssets.push({
//                         assetname: asset.coin,
//                         reason: "No networks available for this asset",
//                     });
//                     continue;
//                 }

//                 const existingAsset = await Assets.findOne({ symbol: asset.coin });
//                 if (existingAsset) {
//                     skippedAssets.push({
//                         assetname: asset.coin,
//                         reason: "Asset already exists",
//                     });
//                     continue;
//                 }

//                 const networkIds = [];

//                 for (const networkData of asset.networkList) {
//                     try {
//                         const network = await Network.findOneAndUpdate(
//                             { networkName: networkData.network },
//                             {
//                                 $set: {
//                                     networkName: networkData.network,
//                                     networkSymbol: asset.coin,
//                                     chain: asset.coin,
//                                     depositEnable: networkData.depositEnable || false,
//                                     withdrawEnable: networkData.withdrawEnable || false,
//                                     status: true,
//                                     addressRegex: networkData.addressRegex || "",
//                                     memoRegex: networkData.memoRegex || "",
//                                     constractAddressUrl: networkData.contractAddressUrl || "",
//                                     exchange: ["binance"],
//                                 },
//                             },
//                             { upsert: true, new: true, runValidators: true }
//                         );

//                         networkIds.push({
//                             networkId: network._id,
//                             contractAddress: networkData.contractAddress || "",
//                             withdrawalFees: Number(networkData.withdrawFee) || 0,
//                             minWithDraw: Number(networkData.withdrawMin) || 0,
//                             minDeposit: Number(networkData.depositDust) || 0,
//                             maxWithDraw: Number(networkData.withdrawMax) || 0,
//                         });
//                     } catch (err) {
//                         errors.push({
//                             assetname: asset.coin,
//                             network: networkData.network,
//                             error: err.message,
//                         });
//                     }
//                 }

//                 if (networkIds.length === 0) {
//                     skippedAssets.push({
//                         assetname: asset.coin,
//                         reason: "No valid networks found",
//                     });
//                     continue;
//                 }

//                 const saved = await Assets.create({
//                     assetname: asset.name,
//                     symbol: asset.coin,
//                     DepositStatus: asset.depositAllEnable,
//                     WithdrawalStatus: asset.withdrawAllEnable,
//                     networkIds,
//                     image: "",
//                     status: asset.trading,
//                     exchange: ["binance"],
//                 });

//                 savedAssets.push({
//                     assetname: saved.assetname,
//                     assetSymbol: saved.symbol,
//                     networksCount: saved.networkIds.length,
//                 });

//             } catch (err) {
//                 errors.push({
//                     assetname: asset.coin,
//                     error: err.message,
//                 });
//             }
//         }

//         return res.status(200).json({
//             success: true,
//             result: {
//                 saved: savedAssets.length,
//                 skipped: skippedAssets.length,
//                 errors: errors.length,
//                 details: {
//                     savedAssets,
//                     skippedAssets,
//                     errors,
//                 },
//             },
//             message: `Assets saved: ${savedAssets.length}, skipped: ${skippedAssets.length}`,
//         });

//     } catch (error) {
//         console.error("Error saving assets:", error.message);
//         return res.status(500).json({
//             success: false,
//             message: "Failed to save assets",
//             error: error.message,
//         });
//     }
// };

//     try {
//         console.log("saveAssetsFromAssetConfig");
//         const assetConfigData = await getAssetConfig();

//         if (!Array.isArray(assetConfigData) || assetConfigData.length === 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: "No asset config data received",
//             });
//         }

//         const savedAssets = [];
//         const skippedAssets = [];
//         const errors = [];

//         for (const asset of assetConfigData) {
//             try {
//                 const existingAsset = await Assets.findOne({ symbol: asset.coin });
//                 if (existingAsset) {
//                     skippedAssets.push({
//                         assetname: asset.coin,
//                         reason: "Asset already exists",
//                     });
//                     continue;
//                 }

//                 // Check if asset has networks
//                 if (!Array.isArray(asset.networkList) || asset.networkList.length === 0) {
//                     skippedAssets.push({
//                         assetname: asset.coin,
//                         reason: "No networks available for this asset",
//                     });
//                     continue;
//                 }

//                 const networkIds = [];

//                 // Process each network for this asset
//                 for (const networkData of asset.networkList) {
//                     // Find network by networkName matching the 'network' field from Binance
//                     const existingNetwork = await Network.findOne({ networkName: networkData.network });

//                     if (!existingNetwork) {
//                         console.warn(`Network '${networkData.network}' not found for asset ${asset.coin}`);
//                         continue;
//                     }

//                     networkIds.push({
//                         networkId: existingNetwork._id,
//                         contractAddress: networkData.contractAddress || "",
//                         withdrawalFees: parseFloat(networkData.withdrawFee) || 0,
//                         minWithDraw: parseFloat(networkData.withdrawMin) || 0,
//                         minDeposit: parseFloat(networkData.depositDust) || 0,
//                         maxWithDraw: parseFloat(networkData.withdrawMax) || 0
//                     });
//                 }

//                 // Only save asset if at least one network was found
//                 if (networkIds.length === 0) {
//                     skippedAssets.push({
//                         assetname: asset.coin,
//                         reason: "No valid networks found for this asset",
//                     });
//                     continue;
//                 }

//                 const newAsset = new Assets({
//                     assetname: asset.name,
//                     symbol: asset.coin,
//                     DepositStatus: asset.depositAllEnable,
//                     WithdrawalStatus: asset.withdrawAllEnable,
//                     networkIds: networkIds,
//                     image: "",
//                     status: asset.trading,
//                     exchange: ["binance"]

//                 });
//                 const saved = await newAsset.save();
//                 savedAssets.push(
//                     {
//                         assetname: saved.assetname,
//                         assetSymbol: saved.symbol,
//                         networksCount: saved.networkIds.length,
//                         reason: "Asset saved successfully",
//                     }
//                 )
//             } catch (error) {
//                 errors.push({
//                     assetname: asset.coin,
//                     error: error.message,
//                 });
//             }
//         }

//         return res.status(200).json({
//             success: true,
//             result: {
//                 saved: savedAssets.length,
//                 skipped: skippedAssets.length,
//                 errors: errors,
//                 details: {
//                     savedAssets,
//                     skippedAssets,
//                     errors
//                 }
//             },
//             message: `${savedAssets.length} Assets saved successfully and ${skippedAssets.length} skipped`,
//         });
//     } catch (error) {
//         console.error("Error saving assets:", error.message);
//         return res.status(500).json({
//             success: false,
//             result: null,
//             message: "Failed to save assets",
//         });
//     }

// }


const getAssetFromDB = async () => {
  try {
    const data = await Assets.find().lean()
      .populate("networkIds.networkId");
    return data;
  } catch (err) {
    throw err;
  }
};

const getAssets = async (req, res) => {
  try {
    // const assets = await Assets.find().lean()
    //     .populate("networkIds.networkId"); 

    const assets = await getAssetFromDB();

    return res.status(200).json({
      success: true,
      result: {
        total: assets.length,
        data: assets,
      },
      message: "Assets fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching assets:", error.message);
    return res.status(500).json({
      success: false,
      result: null,
      message: "Failed to fetch assets",
    });
  }
};



const getAssestForWithdrawal = async (req, res) => {
  try {
    const assets = await Assets.find().populate("networkIds.networkId");

    // Fetch current balances from Binance
    const accountInfo = await binanceGet("/api/v3/account");
    console.log(accountInfo,"giugiugigiug");
    // accountInfo.balances has {asset, free, locked}
    const balances = accountInfo.balances || [];

    // Map for quick lookup
    const balanceMap = {};
    balances.forEach((b) => {
      balanceMap[b.asset] = b.free;
    });

    const result = assets.map((asset) => {
      const assetObj = asset.toObject();
      const freeBalance = balanceMap[asset.symbol] || "0";
      return {
        ...assetObj,
        balance: freeBalance
      };
    });

    return res.status(200).json({
      success: true,
      result: {
        total: result.length,
        data: result,
      },
      message: "Withdrawal assets fetched successfully",
    });

  } catch (error) {
    console.error("Error fetching assets for withdrawal:", error.message);
    return res.status(500).json({
      success: false,
      result: null,
      message: "Failed to fetch assets for withdrawal",
    });
  }
};



// const getImageFromBinance = async (req, res) => {
//     try {
//         const assets = await Assets.fon
//     }
// }


// const getAssets = async (req, res) => {
//     try {
//         const assets = await Assets.find();
//         const network = await Network.find();
//         return res.status(200).json({
//             success: true,
//             result: {
//                 total: assets.length,
//                 data: assets,
//             },
//             message: "Assets fetched successfully",
//         });
//     } catch (error) {
//         console.error("Error fetching assets:", error.message);
//         return res.status(500).json({
//             success: false,
//             result: null,
//             message: "Failed to fetch assets",
//         });
//     }
// };

module.exports = {
  saveAssetsFromAssetConfig,
  getAssets,
  getAssestForWithdrawal,
  getAssetFromDB

}