const mongoose = require("mongoose");

const networkSchema = new mongoose.Schema({
    networkName: String,
    networkSymbol:String,
    chain:String,
    depositEnable:{ type: Boolean, default: false },
    withdrawEnable: { type: Boolean, default: false },
    status: { type: Boolean, default: true },
    addressRegex: String,
    memoRegex: String,
    constractAddressUrl: String,
    exchange:[String]
}, {
    timestamps: true
})

const network = mongoose.model("network", networkSchema);

module.exports = network