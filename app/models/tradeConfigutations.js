const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const tradeConfigSchema = new mongoose.Schema(
    {

        type: {
            type: String,
            enum: ["spot", "future"],
            required: true,
            index: true,
        },

        status: {
            type: Boolean,
            default: true,
            index: true,
        },
        buyCommission: {
            type: Number,
            default: 0,
        },
        sellCommission: {
            type: Number,
            default: 0,
        }
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// compound unique index
tradeConfigSchema.index(
    {
        type: 1,
    }
);

tradeConfigSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("tradeconfigurations", tradeConfigSchema);