const Network = require("../../../models/network");
const { getAssetConfig } = require("../binanceApi");


const saveNetworkFromAssets = async (req, res) => {
    try {
        // Call the asset config endpoint
        const assetConfigData = await getAssetConfig();

        if (!Array.isArray(assetConfigData) || assetConfigData.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No asset config data received",
            });
        }

        const savedNetworks = [];
        const skippedNetworks = [];
        const errors = [];

        for (const coin of assetConfigData) {

            if (!coin.networkList || !Array.isArray(coin.networkList)) {
                continue;
            }

            for (const network of coin.networkList) {
                try {
                    const existingNetwork = await Network.findOne({ networkName: network.name, chain: coin.coin });
                    if (existingNetwork) {
                        skippedNetworks.push({
                            networkName: network.name,
                            chain: coin.coin,
                            reason: "Network already exists"
                        })
                        continue;
                    }
                    const newNetwork = new Network({
                        networkName: network.name,
                        chain: coin.coin,
                        networkSymbol: network.networkSymbol,
                        depositEnable: network.depositEnable,
                        withdrawEnable: network.withdrawEnable,
                        status: network.status,
                        addressRegex: network.addressRegex,
                        memoRegex: network.memoRegex,
                        constractAddressUrl: network.constractAddressUrl,
                        exchange: network.exchange
                    });
                    await newNetwork.save();
                    console.log(`Network ${network.name} saved for ${coin.coin}`);

                } catch (error) {
                    console.error(`Error saving network ${network.name} for ${coin.coin}: ${error.message}`);
                    errors.push({
                        networkName: network.name,
                        chain: coin.coin,
                        reason: error.message
                    });
                }
            }
        }
        return res.status(200).json({
            success: true,
            result: {
                saved: savedNetworks.length,
                skipped: skippedNetworks.length,
                errors: errors.length,
                details: {
                    savedNetworks,
                    skippedNetworks,
                    errors
                },
            },
            message: `${savedNetworks.length} Networks saved successfully and ${skippedNetworks.length} skipped due to existing networks`,
        });
    } catch (error) {
        console.error("Error saving networks:", error.message);
        return res.status(500).json({
            success: false,
            result: null,
            message: error.message
        });
    }
}

module.exports = {
    saveNetworkFromAssets
}