const Network = require("../../../models/network");
const { getAssetConfig } = require("../binanceApi");

// 🔹 Fetch asset config and save networks to DB (create or update using bulkWrite)
const saveNetworksFromAssetConfig = async (req, res) => {
  try {
    // Call the asset config endpoint
    const assetConfigData = await getAssetConfig();

    if (!Array.isArray(assetConfigData) || assetConfigData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No asset config data received",
      });
    }

    const extractChain = (name = "") => {
      const match = name.match(/\(([^)]+)\)/);
      return match ? match[1] : "";
    };

    const bulkOperations = [];
    const networkMetaMap = [];

    // Build bulk operations
    for (const coin of assetConfigData) {
      if (!coin.networkList || !Array.isArray(coin.networkList)) {
        continue;
      }

      for (const network of coin.networkList) {
        bulkOperations.push({
          updateOne: {
            filter: { networkName: network.name },
            update: {
              $set: {
                networkName: network.name,
                networkSymbol: network.network,
                chain: extractChain(network.name) || "",
                depositEnable: network.depositEnable || false,
                withdrawEnable: network.withdrawEnable || false,
                status: true,
                addressRegex: network.addressRegex || "",
                memoRegex: network.memoRegex || "",
                constractAddressUrl: network.contractAddressUrl || "",
                exchange: ["binance"],
              },
            },
            upsert: true,
          },
        });

        networkMetaMap.push({
          networkName: network.name,
          networkSymbol: network.network,
          chain: extractChain(network.name) || "",
        });
      }
    }

    // Nothing to insert
    if (bulkOperations.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid network data found",
      });
    }

    // Execute bulkWrite
    const bulkResult = await Network.bulkWrite(bulkOperations, {
      ordered: false,
    });

    const created = bulkResult.upsertedCount || 0;
    const updated = bulkResult.modifiedCount || 0;
    const total = bulkOperations.length;

    const savedNetworks = networkMetaMap.slice(0, created).map(n => ({ ...n, status: "created" }));
    const updatedNetworks = networkMetaMap.slice(created, created + updated).map(n => ({ ...n, status: "updated" }));

    return res.status(200).json({
      success: true,
      result: {
        created,
        updated,
        total,
        details: {
          savedNetworks,
          updatedNetworks,
        },
      },
      message: `Successfully created ${created} networks, updated ${updated} networks`,
    });

  } catch (error) {
    console.error("Error saving networks from asset config:", error.message);
    return res.status(500).json({
      success: false,
      result: null,
      message: "Failed to save networks from asset config",
      error: error.message,
    });
  }
};

//     const savedNetworks = [];
// const skippedNetworks = [];
// const errors = [];

// const bulkOperations = [];
// const networkMetaMap = new Map(); // track data for response mapping

// //  Build bulk operations
// for (const coin of assetConfigData) {
//   if (!Array.isArray(coin.networkList)) continue;

//   for (const network of coin.networkList) {
//     if (!network?.name) continue;

//     const key = `${network.name}_${coin.coin}`;

//     // Store metadata for response mapping
//     networkMetaMap.set(key, {
//       networkName: network.name,
//       networkSymbol: coin.coin,
//       chain: coin.coin,
//     });

//     bulkOperations.push({
//       updateOne: {
//         filter: {
//           networkName: network.name,
//           chain: coin.coin,
//         },
//         update: {
//           $setOnInsert: {
//             networkName: network.name,
//             networkSymbol: coin.coin,
//             chain: coin.coin,
//             depositEnable: Boolean(network.depositEnable),
//             withdrawEnable: Boolean(network.withdrawEnable),
//             status: true,
//             addressRegex: network.addressRegex ?? "",
//             memoRegex: network.memoRegex ?? "",
//             constractAddressUrl: network.contractAddressUrl ?? "",
//             exchange: ["Binance"],
//           },
//         },
//         upsert: true,
//       },
//     });
//   }
// }

// //  Nothing to insert
// if (bulkOperations.length === 0) {
//   return res.status(400).json({
//     success: false,
//     message: "No valid network data found",
//   });
// }

// //  Execute bulkWrite
// let bulkResult;

// try {
//   bulkResult = await Network.bulkWrite(bulkOperations, {
//     ordered: false,
//   });
// } catch (err) {
//   return res.status(500).json({
//     success: false,
//     message: "Bulk write failed",
//     error: err.message,
//   });
// }
// //  Build saved / skipped arrays

// //  Saved (newly inserted)
// if (bulkResult.upsertedIds) {
//   Object.values(bulkResult.upsertedIds).forEach((item) => {
//     savedNetworks.push({
//       id: item._id,
//     });
//   });
// }

// //  Skipped (already existed)
// const insertedCount = bulkResult.upsertedCount || 0;
// const skippedCount = bulkOperations.length - insertedCount;

// let skipIndex = 0;
// for (const meta of networkMetaMap.values()) {
//   if (skipIndex >= skippedCount) break;

//   skippedNetworks.push({
//     networkName: meta.networkName,
//     chain: meta.chain,
//     reason: "Network already exists",
//   });

//   skipIndex++;
// }

// //  Final response
// return res.status(200).json({
//   success: true,
//   message: "Networks synced successfully",
//   result: {
//     inserted: insertedCount,
//     skipped: skippedCount,
//     savedNetworks,
//     skippedNetworks,
//     errors,
//   },
// });
// 🔹 GET all networks from DB
const getAllNetworks = async (req, res) => {
  try {
    const networks = await Network.find();

    return res.status(200).json({
      success: true,
      result: {
        total: networks.length,
        data: networks,
      },
      message: "Networks fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching networks:", error.message);
    return res.status(500).json({
      success: false,
      result: null,
      message: "Failed to fetch networks",
    });
  }
};

// 🔹 GET networks by chain
const getNetworksByChain = async (req, res) => {
  try {
    const { chain } = req.params;

    if (!chain) {
      return res.status(400).json({
        success: false,
        message: "Chain parameter is required",
      });
    }

    const networks = await Network.find({ chain });

    return res.status(200).json({
      success: true,
      result: {
        chain,
        total: networks.length,
        data: networks,
      },
      message: `Networks for ${chain} fetched successfully`,
    });
  } catch (error) {
    console.error("Error fetching networks by chain:", error.message);
    return res.status(500).json({
      success: false,
      result: null,
      message: "Failed to fetch networks by chain",
    });
  }
};

// 🔹 DELETE a network
const deleteNetwork = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Network.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Network not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Network deleted successfully",
      result: deleted,
    });
  } catch (error) {
    console.error("Error deleting network:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete network",
    });
  }
};

// 🔹 UPDATE a network
const updateNetwork = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = await Network.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Network not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Network updated successfully",
      result: updated,
    });
  } catch (error) {
    console.error("Error updating network:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update network",
    });
  }
};

module.exports = {
  saveNetworksFromAssetConfig,
  getAllNetworks,
  getNetworksByChain,
  deleteNetwork,
  updateNetwork,
};
