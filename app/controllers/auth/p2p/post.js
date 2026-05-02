const P2P = require("../../../models/p2p");
const User = require("../../../models/user");
const ownWallet = require("../../../models/ownWallet");
const PaymentMethod = require("../../../models/paymentMethod");
const mongoose = require("mongoose");
const P2POrder = require("../../../models/p2pOrder");
const { sendNotification } = require("../../../utils/notificationHelper");
const { getIO } = require("../../Ticket/socket/TicketMessSocket");
const { logger } = require("../../../../winston");

// const createP2PPost = async (req, res) => {
//     try {
//         const {
//             side,
//             fiat,
//             crypto,
//             price,
//             volume,
//             minPrice,
//             maxPrice,
//             timeLimit,
//             paymentMethod,
//         } = req.body;

//         const userId = req.user._id;
//         const symbol = crypto.toUpperCase();
//         const postVolume = Number(volume);

//         if (!paymentMethod || (Array.isArray(paymentMethod) && paymentMethod.length === 0)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Payment method is required",
//             });
//         }

//         const methods = Array.isArray(paymentMethod) ? paymentMethod : [paymentMethod];

//         const validPayments = await PaymentMethod.find({
//             _id: { $in: methods },
//             userId,
//         });

//         if (validPayments.length === 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: "No valid payment methods found",
//             });
//         }

//         if (!postVolume || postVolume <= 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid volume",
//             });
//         }

//         const wallet = await ownWallet.findOne({
//             userId,
//             asset: symbol,
//         });

//         if (!wallet) {
//             return res.status(404).json({
//                 success: false,
//                 message: "P2P wallet not found",
//             });
//         }
//         if (side === "sell") {
//             if (wallet.free < postVolume) {
//                 return res.status(400).json({
//                     success: false,
//                     message: "Insufficient free balance",
//                 });
//             }
//         }

//         const totalValue = postVolume * Number(price);

//         if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Minimum limit must be less than or equal to maximum limit",
//             });
//         }

//         if (maxPrice && Number(maxPrice) > totalValue) {
//             return res.status(400).json({
//                 success: false,
//                 message: `Maximum limit cannot be greater than the total value (${totalValue.toFixed(2)} ${fiat})`,
//             });
//         }

//         if (side === "sell") {
//             wallet.free -= postVolume;
//             wallet.locked += postVolume;
//             wallet.total = wallet.free + wallet.locked;
//             await wallet.save();
//         }


//         await wallet.save();

//         const transactionId = `P2P${Date.now()}${Math.floor(Math.random() * 1000)}`;

//         const newPost = await P2P.create({
//             side,
//             fiat,
//             crypto: symbol,
//             price,
//             volume: postVolume,
//             originalVolume: postVolume,
//             minPrice: minPrice || 0,
//             maxPrice: maxPrice || 0,
//             paymentMethod,
//             timeLimit,
//             userId,
//             transactionId,
//             status: "active",
//         });

//         await sendNotification({
//             userId: req.user._id,
//             type: "p2p",
//             event: "post_created",
//             title: "Post Created Successfully",
//             message: `Your ${crypto} ${side} post is now active.`,
//         });

//         return res.status(201).json({
//             success: true,
//             message:
//                 side === "sell"
//                     ? "Sell post created successfully"
//                     : "Buy post created successfully",
//             result: {
//                 post: newPost,
//                 wallet: wallet
//                     ? {
//                         asset: wallet.asset,
//                         free: wallet.free,
//                         locked: wallet.locked,
//                         total: wallet.total,
//                     }
//                     : null,
//             },
//         });

//     } catch (error) {
//         console.error("Create P2P Post Error:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Internal server error",
//             error: error.message,
//         });
//     }
// };


const createP2PPost = async (req, res) => {
    try {
        const {
            side,
            fiat,
            crypto,
            price,
            volume,
            minPrice,
            maxPrice,
            timeLimit,
            paymentMethod,
        } = req.body;

        const userId = req.user._id;
        const symbol = crypto.toUpperCase();
        const postVolume = Number(volume);
        const postPrice = Number(price);

        if (!side || !["buy", "sell"].includes(side.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: "Invalid trade side",
            });
        }

        // Payment method validation
        if (!paymentMethod || (Array.isArray(paymentMethod) && paymentMethod.length === 0)) {
            return res.status(400).json({
                success: false,
                message: "Payment method is required",
            });
        }

        const methods = Array.isArray(paymentMethod) ? paymentMethod : [paymentMethod];

        const validPayments = await PaymentMethod.find({
            _id: { $in: methods },
            userId,
        });

        if (validPayments.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid payment methods found",
            });
        }

        // Volume validation
        if (!postVolume || postVolume <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid volume",
            });
        }

        if (!postPrice || postPrice < 1) {
            return res.status(400).json({
                success: false,
                message: "Invalid price",
            });
        }

        const totalValue = postVolume * postPrice;

        if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
            return res.status(400).json({
                success: false,
                message: "Minimum limit must be less than or equal to maximum limit",
            });
        }

        if (maxPrice && Number(maxPrice) > totalValue) {
            return res.status(400).json({
                success: false,
                message: `Maximum limit cannot be greater than total value (${totalValue.toFixed(2)} ${fiat})`,
            });
        }

        let wallet = null;

        // 🔴 ONLY CHECK WALLET FOR SELL
        if (side.toLowerCase() === "sell") {

            wallet = await ownWallet.findOne({
                userId,
                asset: symbol,
            });

            if (!wallet) {
                return res.status(400).json({
                    success: false,
                    message: `You don't have a ${symbol} wallet.`,
                });
            }

            if (wallet.free < postVolume) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient ${symbol} balance. Available: ${wallet.free}, Required: ${postVolume}`,
                });
            }

            // Lock funds
            wallet.free -= postVolume;
            wallet.locked += postVolume;
            wallet.total = wallet.free + wallet.locked;

            await wallet.save();
        }

        const transactionId = `P2P${Date.now()}${Math.floor(Math.random() * 1000)}`;

        const newPost = await P2P.create({
            side: side.toLowerCase(),
            fiat,
            crypto: symbol,
            price: postPrice,
            volume: postVolume,
            originalVolume: postVolume,
            minPrice: minPrice || 0,
            maxPrice: maxPrice || 0,
            paymentMethod: methods,
            timeLimit,
            userId,
            transactionId,
            status: "active",
            activeStatus: true,
        });

        await sendNotification({
            userId,
            type: "p2p",
            event: "post_created",
            title: "Post Created Successfully",
            message: `Your ${symbol} ${side} post is now active.`,
            referenceId: newPost._id.toString(),
        });

        return res.status(201).json({
            success: true,
            message:
                side === "sell"
                    ? "Sell post created successfully"
                    : "Buy post created successfully",
            result: {
                post: newPost,
                wallet: wallet
                    ? {
                        asset: wallet.asset,
                        free: wallet.free,
                        locked: wallet.locked,
                        total: wallet.total,
                    }
                    : null,
            },
        });

    } catch (error) {
        console.error("Create P2P Post Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};


const getAllP2PPosts = async (req, res) => {
    try {
        const { side, crypto, fiat, page = 1, limit = 10 } = req.query;

        const query = { status: "active", activeStatus: true };

        if (side) query.side = side;
        if (crypto) query.crypto = { $regex: new RegExp(`^${crypto}$`, "i") };
        if (fiat) query.fiat = { $regex: new RegExp(`^${fiat}$`, "i") };

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);

        let sort = { createdAt: -1 };
        if (side === "sell") {
            sort = { price: 1 };
        } else if (side === "buy") {
            sort = { price: -1 };
        }

        const posts = await P2P.find(query)
            .sort(sort)
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .populate("userId", "name username email isVerified")
            .populate("paymentMethod");

        const total = await P2P.countDocuments(query);

        return res.status(200).json({
            success: true,
            message: "P2P posts fetched successfully",
            result: posts,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
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

const getMyP2PPosts = async (req, res) => {
    try {
        const userId = req.user._id;
        const { side, crypto, fiat, status, page = 1, limit = 10, fromDate, toDate } = req.query;

        const query = { userId };

        if (side) query.side = side;
        if (crypto) query.crypto = { $regex: new RegExp(`^${crypto}$`, "i") };
        if (fiat) query.fiat = { $regex: new RegExp(`^${fiat}$`, "i") };
        if (status) query.status = status;

        if (fromDate || toDate) {
            query.createdAt = {};
            if (fromDate) query.createdAt.$gte = new Date(fromDate);
            if (toDate) {
                const end = new Date(toDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
        const skip = (pageNum - 1) * limitNum;

        const [posts, total] = await Promise.all([
            P2P.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .populate("paymentMethod"),
            P2P.countDocuments(query),
        ]);

        return res.status(200).json({
            success: true,
            message: "User P2P posts fetched successfully",
            result: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
                posts,
            }
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

const getPostById = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await P2P.findById(id)
            .populate("userId", "name username email isVerified")
            .populate("paymentMethod");

        if (!post) {
            return res.status(404).json({
                success: false,
                result: null,
                message: "Post not found"
            });
        }

        res.status(200).json({
            success: true,
            result: post,
            message: "Post fetched successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            result: null,
            message: "Internal server error"
        });
    }
}

const getAllPostExpectMyPost = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized - user not found"
            });
        }

        const userId = new mongoose.Types.ObjectId(req.user._id);
        const { side, crypto, fiat, status, page = 1, limit = 10, payments, amount } = req.query;

        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
        const skip = (pageNum - 1) * limitNum;

        // Base match
        const match = {
            //  userId: { $ne: userId },
            status: "active",
            activeStatus: true,
        };

        if (side) match.side = side;
        if (crypto) match.crypto = { $regex: new RegExp(`^${crypto}$`, "i") };
        if (fiat) match.fiat = { $regex: new RegExp(`^${fiat}$`, "i") };
        if (status) match.status = status;
        // if (startDate || endDate) {
        //     match.createdAt = {};

        //     if (startDate) {
        //         match.createdAt.$gte = new Date(startDate);
        //     }

        //     if (endDate) {
        //         const end = new Date(endDate);
        //         end.setHours(23, 59, 59, 999);
        //         match.createdAt.$lte = end;
        //     }
        // }
        // Prepare filters
        const paymentFilters = payments
            ? payments.split(",").map((p) => String(p).trim().toLowerCase()).filter(Boolean)
            : null;

        const amountVal = amount ? parseFloat(amount) : null;

        const paymentCollection = PaymentMethod.collection.name;
        const userCollection = User.collection.name;

        const pipeline = [];
        pipeline.push({ $match: match });

        // Lookup payment methods (populate)
        pipeline.push({
            $lookup: {
                from: paymentCollection,
                localField: "paymentMethod",
                foreignField: "_id",
                as: "paymentMethod",
            },
        });

        if (paymentFilters && paymentFilters.length > 0) {
            pipeline.push({
                $match: {
                    $expr: {
                        $gt: [
                            {
                                $size: {
                                    $filter: {
                                        input: "$paymentMethod",
                                        as: "pm",
                                        cond: {
                                            $in: [
                                                { $toLower: "$$pm.type" },
                                                paymentFilters,
                                            ],
                                        },
                                    },
                                },
                            },
                            0,
                        ],
                    },
                },
            });
        }

        if (amountVal !== null && !isNaN(amountVal)) {
            pipeline.push({
                $addFields: {
                    effectiveMax: {
                        $min: [
                            { $ifNull: ["$maxPrice", Infinity] },
                            { $multiply: ["$volume", { $ifNull: ["$price", 0] }] },
                        ],
                    },
                    minPriceVal: { $ifNull: ["$minPrice", 0] },
                },
            });

            pipeline.push({
                $match: {
                    $expr: {
                        $and: [
                            { $lte: ["$minPriceVal", amountVal] },
                            { $gte: ["$effectiveMax", amountVal] },
                        ],
                    },
                },
            });
        }

        // Lookup user info
        pipeline.push({
            $lookup: {
                from: userCollection,
                localField: "userId",
                foreignField: "_id",
                as: "userId",
            },
        });
        pipeline.push({ $unwind: "$userId" });

        // Sort - Always newest first
        pipeline.push({ $sort: { createdAt: -1 } });

        // Facet to get paginated data and total count
        pipeline.push({
            $facet: {
                data: [{ $skip: skip }, { $limit: limitNum }],
                total: [{ $count: "count" }],
            },
        });

        const aggResult = await P2P.aggregate(pipeline);
        const data = aggResult[0]?.data || [];
        const total = aggResult[0]?.total?.[0]?.count || 0;

        // Populate `userId` fields selection for compatibility
        const posts = data.map((d) => ({
            ...d,
            userId: {
                name: d.userId.name,
                username: d.userId.username,
                email: d.userId.email,
                isVerified: d.userId.isVerified,
                _id: d.userId._id,
            },
        }));

        return res.status(200).json({
            success: true,
            message: "P2P posts (excluding yours) fetched successfully",
            result: posts,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
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

// const cancelPost = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const userId = req.user._id;
//         const post = await P2P.findOne({ _id: id, userId });

//         if (!post) {
//             return res.status(404).json({
//                 success: false,
//                 message: "P2P post not found"
//             });
//         }

//         if (post.status === "cancelled") {
//             return res.status(400).json({
//                 success: false,
//                 message: "Post already cancelled",
//             });
//         }

//         const unlockAmount = post.volume;

//         const wallet = await ownWallet.findOne({
//             userId,
//             asset: post.crypto,
//         });

//         if (!wallet) {
//             return res.status(404).json({
//                 success: false,
//                 message: "P2P wallet not found",
//             });
//         }

//         if (post.side === "sell") {
//             wallet.locked -= unlockAmount;
//             wallet.free += unlockAmount;

//             if (wallet.locked < 0) {
//                 wallet.locked = 0;
//             }
//             await wallet.save();
//         }

//         post.status = "cancelled";
//         post.activeStatus = false;
//         await post.save();

//         return res.status(200).json({
//             success: true,
//             message: "P2P post cancelled successfully",
//             result: {
//                 wallet: {
//                     free: wallet.free,
//                     locked: wallet.locked,
//                     total: wallet.total,
//                 },
//             },
//         });
//     } catch (error) {
//         console.error("Error deleting P2P post:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Internal server error",
//             error: error.message
//         });
//     }
// };

const cancelPost = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const post = await P2P.findOne({ _id: id, userId });

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "P2P post not found",
            });
        }

        if (post.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Post already cancelled",
            });
        }

        //  Find all pending orders of this post
        const activeOrders = await P2POrder.find({
            postId: post._id,
            status: { $in: ["pending", "paid"] },
        });

        for (const order of activeOrders) {
            //  Revert Seller Crypto
            const sellerWallet = await ownWallet.findOne({
                userId: order.sellerId,
                asset: post.crypto,
            });

            if (sellerWallet) {
                sellerWallet.locked -= order.quantity;
                sellerWallet.free += order.quantity;
                if (sellerWallet.locked < 0) sellerWallet.locked = 0;
                await sellerWallet.save();
            }

            //  Revert Buyer INR (if locked)
            const buyerWallet = await ownWallet.findOne({
                userId: order.buyerId,
                asset: "INR",
            });

            if (buyerWallet && order.totalAmount) {
                buyerWallet.locked -= order.totalAmount;
                buyerWallet.free += order.totalAmount;
                if (buyerWallet.locked < 0) buyerWallet.locked = 0;
                await buyerWallet.save();
            }

            //  Cancel order
            order.status = "cancelled";
            await order.save();

            // Notify via socket for real-time UI update on affected orders
            // Emit to both _id and transactionId rooms since frontend may join with either
            try {
                getIO().to(order._id.toString()).emit("p2p_updated");
                if (order.transactionId) {
                    getIO().to(order.transactionId.toString()).emit("p2p_updated");
                }
                if (order.orderId) {
                    getIO().to(order.orderId.toString()).emit("p2p_updated");
                }
            } catch (err) {
                console.error("Socket emit error:", err);
            }

            //  Send notifications to buyer and seller
            const orderCancelMsg = `Order ${order.orderId} for ${order.quantity} ${post.crypto} has been cancelled because the post was closed.`;

            await sendNotification({
                userId: order.sellerId,
                type: "p2p",
                event: "order_cancelled",
                title: "Order Cancelled",
                message: orderCancelMsg,
                referenceId: order._id.toString(),
            });

            await sendNotification({
                userId: order.buyerId,
                type: "p2p",
                event: "order_cancelled",
                title: "Order Cancelled",
                message: orderCancelMsg,
                referenceId: order._id.toString(),
            });
        }

        //  Unlock remaining seller locked crypto in post
        if (post.side === "sell") {
            const wallet = await ownWallet.findOne({
                userId,
                asset: post.crypto,
            });

            if (wallet) {
                wallet.locked -= post.volume;
                wallet.free += post.volume;
                if (wallet.locked < 0) wallet.locked = 0;
                await wallet.save();
            }
        }

        // Cancel post
        post.status = "cancelled";
        post.activeStatus = false;
        post.locked = 0;
        await post.save();

        //  Send notification to post creator (seller/buyer)
        const postCancelTitle = "Post Cancelled";
        const postCancelMsg = `Your P2P post for ${post.crypto} (${post.side}) has been cancelled.`;

        await sendNotification({
            userId,
            type: "p2p",
            event: "post_cancelled",
            title: postCancelTitle,
            message: postCancelMsg,
            referenceId: post._id.toString(),
        });

        logger.notification(`Sending notification to user ${userId}: ${postCancelTitle} - ${postCancelMsg}`);

        return res.status(200).json({
            success: true,
            message: "Post and related orders cancelled successfully",
        });
    } catch (error) {
        console.error("Cancel Post Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};


module.exports = {
    createP2PPost,
    getAllP2PPosts,
    getMyP2PPosts,
    getAllPostExpectMyPost,
    cancelPost,
    getPostById
};
