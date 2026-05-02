const P2P = require("../../../models/p2p");
require("../../../models/paymentMethod");



// // Get All P2P Posts with Filters
// const getAllP2PPosts = async (req, res) => {
//   try {
//     const {
//       type,       
//       fromAsset,   
//       toAsset,     
//       page = 1,
//       limit = 10,
//     } = req.query;

//     const query = {
//       status: "active",
//     };

//     if (type) query.type = type;
//     if (fromAsset) query.fromAsset = fromAsset;
//     if (toAsset) query.toAsset = toAsset;

//     const pageNum = parseInt(page, 10);
//     const limitNum = parseInt(limit, 10);

//     let sort = { createdAt: -1 };
//     if (type === "sell") {
//       sort = { price: 1 };   
//     } else if (type === "buy") {
//       sort = { price: -1 };  
//     }

//     const posts = await P2P.find(query)
//       .sort(sort)
//       .skip((pageNum - 1) * limitNum)
//       .limit(limitNum)
//       .populate("user_id", "name username email isVerified")
//       .lean();

//     const total = await P2P.countDocuments(query);

//     return res.status(200).json({
//       success: true,
//       message: "P2P posts fetched successfully",upi", "bank", "paytm", "gpay"
//       result: posts,
//       pagination: {
//         total,
//         page: pageNum,
//         limit: limitNum,
//         totalPages: Math.ceil(total / limitNum),
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching P2P posts:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };

// module.exports = { getAllP2PPosts };



// Get All P2P Posts with Filters
const getAllP2PPosts = async (req, res) => {
    try {
        const { side, crypto, fiat, page = 1, limit = 10 } = req.query;

        const query = { status: "active" };

        if (side) query.side = side;
        if (crypto) query.crypto = crypto;
        if (fiat) query.fiat = fiat;

        // Optional: If amount is provided, check against min/max limits
        // if (req.query.amount) {
        //   const amount = parseFloat(req.query.amount);
        //   query.minPrice = { $lte: amount };
        //   query.maxPrice = { $gte: amount };
        // }

        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            sort: { price: side === "buy" ? 1 : -1 },
        };

        let sort = { createdAt: -1 };
        if (side === "sell") {
            sort = { price: 1 };
        } else if (side === "buy") {
            sort = { price: -1 };
        }


        const posts = await P2P.find(query)
            .sort(sort)
            .skip((options.page - 1) * options.limit)
            .limit(options.limit)
            .populate("userId", "name username email isVerified")
            .populate("paymentMethod");

        const total = await P2P.countDocuments(query);

        return res.status(200).json({
            success: true,
            message: "P2P posts fetched successfully",
            result: posts,
            pagination: {
                total,
                page: options.page,
                limit: options.limit,
                totalPages: Math.ceil(total / options.limit),
            },
        });
    } catch (error) {
        console.error("Error fetching P2P posts:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Get My P2P Posts
const getMyP2PPosts = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 10 } = req.query;

        const posts = await P2P.find({ userId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate("paymentMethod");

        const total = await P2P.countDocuments({ userId });

        return res.status(200).json({
            success: true,
            message: "User P2P posts fetched successfully",
            result: posts,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching user P2P posts:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

module.exports = { getAllP2PPosts, getMyP2PPosts };
