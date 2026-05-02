const mongoose = require("mongoose");
const P2POrder = require("../../../models/p2pOrder");
const P2P = require("../../../models/p2p");
const ownWallet = require("../../../models/ownWallet");
const PaymentMethod = require("../../../models/paymentMethod");
const User = require("../../../models/user");
const { sendNotification } = require("../../../utils/notificationHelper");
const { getIO } = require("../../Ticket/socket/TicketMessSocket");
const { logger } = require("../../../../winston");

const createTradeOrder = async (req, res) => {
  try {
    const { postId, quantity, paymentMethodId, price } = req.body;
    const currentUserId = req.user._id;

    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ success: false, message: "Valid postId is required" });
    }

    if (!quantity || isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({ success: false, message: "Valid quantity is required" });
    }

    if (!paymentMethodId || !mongoose.Types.ObjectId.isValid(paymentMethodId)) {
      return res.status(400).json({ success: false, message: "Valid paymentMethodId is required" });
    }

    const ad = await P2P.findById(postId);
    if (!ad) {
      return res.status(404).json({ success: false, message: "Ad not found" });
    }

    if (ad.status !== "active") {
      return res.status(400).json({ success: false, message: "Ad is not active" });
    }
    // let sellerId, buyerId, orderType;

    // if (ad.side === "sell") {
    //   sellerId = ad.userId;
    //   buyerId = currentUserId;
    //   orderType = "buy";
    // } else {
    //   sellerId = currentUserId;
    //   buyerId = ad.userId;
    //   orderType = "sell";
    // }



    // if (
    //   !paymentMethodId ||
    //   !mongoose.Types.ObjectId.isValid(paymentMethodId)
    // ) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Valid paymentMethodId is required",
    //   });
    // }

    // Unified ID assignments
    const sellerId = ad.side === "sell" ? ad.userId : currentUserId;
    const buyerId = ad.side === "sell" ? currentUserId : ad.userId;
    const orderType = ad.side === "sell" ? "buy" : "sell";

    const paymentMethod = await PaymentMethod.findOne({
      _id: paymentMethodId,
      userId: sellerId,
    });

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Payment method does not belong to seller ",
      });
    }

    if (ad.userId.toString() === currentUserId.toString()) {
      return res.status(400).json({ success: false, message: "You cannot trade with your own ad" });
    }

    if (quantity > ad.volume) {
      return res.status(400).json({ success: false, message: "Requested quantity exceeds available volume" });
    }
    if (ad.minPrice > quantity) {
      return res.status(400).json({ success: false, message: `Requested quantity must be greater than ${ad.minPrice}` });
    }
    if (ad.maxPrice < quantity) {
      return res.status(400).json({ success: false, message: `Requested quantity must be less than ${ad.maxPrice}` });
    }

    const paymentDoc = await PaymentMethod.findById(paymentMethodId);
    if (!paymentDoc) {
      return res.status(404).json({ success: false, message: "Payment method not found" });
    }





    if (orderType === "sell") {
      const sellerWallet = await ownWallet.findOne({
        userId: sellerId,
        asset: ad.crypto.toUpperCase(),
      });

      if (!sellerWallet || sellerWallet.free < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient available balance to sell. You need ${quantity} ${ad.crypto}`,
        });
      }

      sellerWallet.free -= quantity;
      sellerWallet.locked += quantity;
      await sellerWallet.save();
    }



    ad.volume -= quantity;
    ad.locked = (ad.locked || 0) + quantity;

    if (ad.volume <= 0) {
      ad.status = "completed";
      ad.volume = 0;
    }
    await ad.save();


    // Update the minPrice and maxPrice dynamically based on remaining volume
    const remainingVolume = ad.volume;

    // Adjust maxPrice if remaining volume is less than current maxPrice
    // if (remainingVolume < ad.maxPrice) {
    //   ad.maxPrice = remainingVolume;
    // }

    if (remainingVolume < ad.minPrice && remainingVolume > 0) {
      ad.minPrice = remainingVolume;
    }

    await ad.save();

    // const transactionId =
    //   "TXN" + Date.now() + "-" + Math.floor(Math.random() * 1000000);

    const orderId = `ORD${Date.now()}${Math.floor(Math.random() * 10000)}`;

    const transactionId = orderId;

    const newOrder = await P2POrder.create({
      transactionId,
      orderId,
      postId,
      sellerId,
      buyerId,
      quantity,
      paymentMethodId,
      price: price || ad.price,
      image: "",
      status: "pending",
      crypto: ad.crypto,
      fiat: ad.fiat,
      coinName: ad.crypto,
      expireTime: ad.timeLimit,
    });

    const sellerTitle = "New Order Received";
    const sellerMessage = `You have a new order for ${quantity} ${ad.crypto}.`;
    await sendNotification({
      userId: sellerId,
      type: "p2p",
      event: "order_created",
      title: sellerTitle,
      message: sellerMessage,
      referenceId: newOrder._id.toString(),
    });
    logger.notification(`Sending notification to user ${sellerId}: ${sellerTitle} - ${sellerMessage}`);

    const buyerTitle = "Order Placed Successfully";
    const buyerMessage = `You have successfully placed an order for ${quantity} ${ad.crypto}.`;
    await sendNotification({
      userId: buyerId,
      type: "p2p",
      event: "order_created",
      title: buyerTitle,
      message: buyerMessage,
      referenceId: newOrder._id.toString(),
    });
    logger.notification(`Sending notification to user ${buyerId}: ${buyerTitle} - ${buyerMessage}`);

    return res.status(201).json({
      success: true,
      message: "Order created successfully. Please complete the payment.",
      result: newOrder,
    });
  } catch (error) {
    console.error("Create Trade Order Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// const createTradeOrder = async (req, res) => {
//   try {
//     const { postId, quantity, paymentMethodId, price } = req.body;
//     const currentUserId = req.user._id;

//     // Validation
//     if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
//       return res.status(400).json({ success: false, message: "Valid postId is required" });
//     }

//     if (!quantity || isNaN(quantity) || quantity <= 0) {
//       return res.status(400).json({ success: false, message: "Valid quantity is required" });
//     }

//     if (!paymentMethodId || !mongoose.Types.ObjectId.isValid(paymentMethodId)) {
//       return res.status(400).json({ success: false, message: "Valid paymentMethodId is required" });
//     }

//     const ad = await P2P.findById(postId);
//     if (!ad) {
//       return res.status(404).json({ success: false, message: "Ad not found" });
//     }

//     if (ad.status !== "active") {
//       return res.status(400).json({ success: false, message: "Ad is not active or already completed" });
//     }

//     // Check available volume
//     if (quantity > ad.volume) {
//       return res.status(400).json({ 
//         success: false, 
//         message: `Only ${ad.volume} ${ad.crypto} available. Requested: ${quantity}` 
//       });
//     }

//     // Determine roles
//     const sellerId = ad.side === "sell" ? ad.userId : currentUserId;
//     const buyerId = ad.side === "sell" ? currentUserId : ad.userId;
//     const isCurrentUserSeller = ad.side === "buy";

//     // Validate payment method belongs to seller
//     const paymentMethod = await PaymentMethod.findOne({
//       _id: paymentMethodId,
//       userId: sellerId,
//     });

//     if (!paymentMethod) {
//       return res.status(400).json({
//         success: false,
//         message: "Payment method does not belong to seller",
//       });
//     }

//     // Prevent self-trading
//     if (ad.userId.toString() === currentUserId.toString()) {
//       return res.status(400).json({ success: false, message: "You cannot trade with your own ad" });
//     }

//     // Calculate trade amount
//     const currentPrice = price || ad.price;
//     const tradeAmount = quantity * currentPrice;

//     // DYNAMIC MIN/MAX AMOUNT CALCULATION
//     // Calculate max possible amount based on remaining volume
//     const remainingVolume = ad.volume;
//     const maxPossibleAmount = remainingVolume * currentPrice;

//     // Dynamic minimum amount (cannot be less than 1 unit of fiat or original minPrice)
//     const dynamicMinAmount = Math.min(
//       ad.minPrice || 0, 
//       maxPossibleAmount
//     ) || Math.min(100, maxPossibleAmount); // Default 100 if not set

//     // Dynamic maximum amount (cannot exceed remaining volume value or original maxPrice)
//     const dynamicMaxAmount = Math.min(
//       ad.maxPrice || Infinity,
//       maxPossibleAmount
//     );

//     // Validate trade amount against dynamic limits
//     if (tradeAmount < dynamicMinAmount) {
//       return res.status(400).json({ 
//         success: false, 
//         message: `Trade amount ${tradeAmount.toFixed(2)} ${ad.fiat} is below minimum ${dynamicMinAmount.toFixed(2)} ${ad.fiat}` 
//       });
//     }

//     if (tradeAmount > dynamicMaxAmount) {
//       return res.status(400).json({ 
//         success: false, 
//         message: `Trade amount ${tradeAmount.toFixed(2)} ${ad.fiat} exceeds maximum ${dynamicMaxAmount.toFixed(2)} ${ad.fiat}` 
//       });
//     }

//     // Lock seller's funds
//     if (isCurrentUserSeller) {
//       const sellerWallet = await ownWallet.findOne({
//         userId: currentUserId,
//         asset: ad.crypto.toUpperCase(),
//       });

//       if (!sellerWallet || sellerWallet.free < quantity) {
//         return res.status(400).json({
//           success: false,
//           message: `Insufficient balance. You need ${quantity} ${ad.crypto}`,
//         });
//       }

//       sellerWallet.free -= quantity;
//       sellerWallet.locked = (sellerWallet.locked || 0) + quantity;
//       await sellerWallet.save();
//     } else {
//       // Ad creator is selling, lock their funds
//       const sellerWallet = await ownWallet.findOne({
//         userId: ad.userId,
//         asset: ad.crypto.toUpperCase(),
//       });

//       if (!sellerWallet || sellerWallet.free < quantity) {
//         return res.status(400).json({
//           success: false, 
//           message: `Seller has insufficient balance for this trade`,
//         });
//       }

//       sellerWallet.free -= quantity;
//       sellerWallet.locked = (sellerWallet.locked || 0) + quantity;
//       await sellerWallet.save();
//     }

//     // Update ad volume
//     ad.volume -= quantity;

//     // Update dynamic minPrice and maxPrice based on remaining volume
//     const newRemainingVolume = ad.volume;
//     const newMaxPossibleAmount = newRemainingVolume * currentPrice;

//     // Adjust maxPrice to not exceed remaining volume value
//     if (ad.maxPrice > newMaxPossibleAmount) {
//       ad.maxPrice = newMaxPossibleAmount;
//     }

//     // Adjust minPrice if it exceeds new maxPrice
//     if (ad.minPrice > ad.maxPrice) {
//       ad.minPrice = Math.max(0, ad.maxPrice * 0.1); // 10% of max or 0
//     }

//     // Mark completed if no volume left
//     if (ad.volume <= 0) {
//       ad.status = "completed";
//       ad.activeStatus = false;
//       ad.maxPrice = 0;
//       ad.minPrice = 0;
//     }

//     await ad.save();

//     // Generate unique order ID
//     const orderId = `ORD${Date.now()}${Math.floor(Math.random() * 10000)}`;

//     const newOrder = await P2POrder.create({
//       transactionId: orderId,
//       orderId: orderId,
//       postId,
//       sellerId,
//       buyerId,
//       quantity,
//       paymentMethodId,
//       price: currentPrice,
//       totalAmount: tradeAmount,
//       image: "",
//       status: "pending",
//       crypto: ad.crypto,
//       fiat: ad.fiat,
//       coinName: ad.crypto,
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Order created successfully",
//       result: newOrder,
//       dynamicLimits: {
//         minAmount: dynamicMinAmount,
//         maxAmount: dynamicMaxAmount,
//         remainingVolume: ad.volume
//       }
//     });
//   } catch (error) {
//     console.error("Create Trade Order Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };

const uploadTradeImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const imageUrl = `/uploads/p2p/${req.file.filename}`;

    return res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      result: imageUrl,
    });
  } catch (error) {
    console.error("Upload Image Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


const getTradeOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const order = await P2POrder.findById(id)
      .populate("sellerId", "name email")
      .populate("buyerId", "name email")
      .populate("postId")
      .populate("paymentMethodId");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const isSeller = order.sellerId._id.toString() === userId.toString();
    const isBuyer = order.buyerId._id.toString() === userId.toString();

    if (!isSeller && !isBuyer) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this order",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order fetched successfully",
      result: order,
    });

  } catch (error) {
    console.error("Get Trade Order Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    // const order = await P2POrder.findById({transactionId: id})
    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { orderId: id }, { transactionId: id }] };
    } else {
      query = { $or: [{ orderId: id }, { transactionId: id }] };
    }

    const order = await P2POrder.findOne(query)
      .populate("sellerId", "name username email")
      .populate("buyerId", "name username email")
      .populate("messages.from", "name username");

    if (!order) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    // Check if user is part of the chat
    const userId = req.user._id.toString();
    if (order.sellerId._id.toString() !== userId && order.buyerId._id.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    res.status(200).json({ success: true, result: order });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const confirmPayment = async (req, res) => {
  try {
    const { orderId, image } = req.body;
    const userId = req.user._id;
    // const order = await P2POrder.findById(orderId);
    let query;
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      query = { $or: [{ _id: orderId }, { orderId: orderId }, { transactionId: orderId }] };
    } else {
      query = { $or: [{ orderId: orderId }, { transactionId: orderId }] };
    }

    const order = await P2POrder.findOne(query);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.buyerId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Only buyer can confirm payment" });
    }

    order.image = image;
    order.status = "paid";
    await order.save();

    // Notify via socket for real-time UI update (emit to all room variants)
    try {
      getIO().to(order._id.toString()).emit("p2p_updated");
      if (order.transactionId) getIO().to(order.transactionId.toString()).emit("p2p_updated");
      if (order.orderId) getIO().to(order.orderId.toString()).emit("p2p_updated");
    } catch (err) {
      console.error("Socket emit error:", err);
    }

    const sellerTitle = "Buyer uploaded payment proof";
    const sellerMessage = "Buyer has uploaded payment proof for the order.";
    await sendNotification({
      userId: order.sellerId,
      type: "p2p",
      event: "order_paid",
      title: sellerTitle,
      message: sellerMessage,
      referenceId: order._id.toString(),
    });

    logger.notification(`Sending notification to user ${order.sellerId}: ${sellerTitle} - ${sellerMessage}`);

    const buyerTitle = "Payment proof uploaded";
    const buyerMessage = "You have uploaded payment proof for the order.";
    await sendNotification({
      userId: order.buyerId,
      type: "p2p",
      event: "order_paid",
      title: buyerTitle,
      message: buyerMessage,
      referenceId: order._id.toString(),
    });
    logger.notification(`Sending notification to user ${order.buyerId}: ${buyerTitle} - ${buyerMessage}`);


    return res.status(200).json({
      success: true,
      message: "Payment marked as paid. Waiting for seller to release.",
      result: order,
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const releaseAssets = async (req, res) => {
  try {
    const { orderId } = req.body;
    const currentUserId = req.user._id;

    if (!orderId) {
      return res.status(400).json({ success: false, message: "Order ID is required" });
    }
    // const order = await P2POrder.findById(orderId);
    let query;
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      query = { $or: [{ _id: orderId }, { orderId: orderId }, { transactionId: orderId }] };
    } else {
      query = { $or: [{ orderId: orderId }, { transactionId: orderId }] };
    }

    const order = await P2POrder.findOne(query);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status === "completed" || order.status === "cancelled") {
      return res.status(400).json({ success: false, message: "Order is already closed" });
    }

    if (order.sellerId.toString() !== currentUserId.toString()) {
      return res.status(403).json({ success: false, message: "Only seller can release assets" });
    }

    // Allow release if status is paid or if it timed out AFTER payment (still has image proof)
    if (order.status !== "paid" && order.status !== "timeout") {
      return res.status(400).json({ success: false, message: "Release is only allowed for paid orders." });
    }

    if (order.status === "timeout" && !order.image) {
      return res.status(400).json({ success: false, message: "Order timed out before payment. Assets have already been reverted." });
    }

    const assetSymbol = order.crypto.toUpperCase();
    const sellerWallet = await ownWallet.findOne({ userId: order.sellerId, asset: assetSymbol });
    if (!sellerWallet) {
      return res.status(400).json({
        success: false,
        message: `Seller wallet not found for asset: ${assetSymbol}`
      });
    }

    if (sellerWallet.locked < order.quantity) {
      return res.status(500).json({ success: false, message: "System Error: Insufficient locked assets in seller wallet" });
    }

    sellerWallet.locked -= order.quantity;

    if (sellerWallet.locked < 0) {
      sellerWallet.locked = 0;
    }

    sellerWallet.total = sellerWallet.free + sellerWallet.locked;

    await sellerWallet.save();


    // let buyerWallet = await ownWallet.findOne({ userId: order.buyerId, asset: order.crypto });
    // if (!buyerWallet) {
    //   buyerWallet = new ownWallet({
    //     userId: order.buyerId,
    //     asset: order.crypto,
    //     name: order.coinName || order.crypto,
    //     from: order.crypto,
    //     to: "USDT",
    //     free: 0,
    //     locked: 0,
    //     total: 0
    //   });
    //   buyerWallet.name = sellerWallet.name;
    //   buyerWallet.icon = sellerWallet.icon;
    //   buyerWallet.from = sellerWallet.from;
    //   buyerWallet.to = sellerWallet.to;
    // }

    // buyerWallet.free += order.quantity;
    // if (buyerWallet.total !== undefined) {
    //   buyerWallet.total = buyerWallet.free + buyerWallet.locked;
    // }

    let buyerWallet = await ownWallet.findOne({
      userId: order.buyerId,
      asset: order.crypto,
    });

    if (buyerWallet) {
      // Update existing wallet
      buyerWallet.free += order.quantity;
      buyerWallet.total = buyerWallet.free + buyerWallet.locked;
    } else {
      // Create new wallet
      buyerWallet = new ownWallet({
        userId: order.buyerId,
        asset: order.crypto,
        name: sellerWallet.name || order.crypto,
        icon: sellerWallet.icon || "",
        from: sellerWallet.from || "SPOT",
        to: sellerWallet.to || "P2P",
        free: order.quantity,
        locked: 0,
        total: order.quantity,
      });
    }

    await buyerWallet.save();

    order.status = "completed";
    order.paymentStatus = true;
    await order.save();

    // Notify via socket for real-time UI update (emit to all room variants)
    try {
      getIO().to(order._id.toString()).emit("p2p_updated");
      if (order.transactionId) getIO().to(order.transactionId.toString()).emit("p2p_updated");
      if (order.orderId) getIO().to(order.orderId.toString()).emit("p2p_updated");
    } catch (err) {
      console.error("Socket emit error:", err);
    }

    const buyerTitle = "Order Completed";
    const buyerMessage = "Seller has released the crypto.";
    await sendNotification({
      userId: order.buyerId,
      type: "p2p",
      event: "asset_released",
      title: buyerTitle,
      message: buyerMessage,
      referenceId: order._id.toString(),
    });
    logger.notification(`Sending notification to user ${order.buyerId}: ${buyerTitle} - ${buyerMessage}`);


    const sellerTitle = "Assets Released";
    const sellerMessage = "You have successfully released the assets.";
    await sendNotification({
      userId: order.sellerId,
      type: "p2p",
      event: "asset_released",
      title: sellerTitle,
      message: sellerMessage,
      referenceId: order._id.toString(),
    });
    logger.notification(`Sending notification to user ${order.sellerId}: ${sellerTitle} - ${sellerMessage}`);


    return res.status(200).json({
      success: true,
      message: "Assets released successfully. Order Completed.",
      result: order
    });

  } catch (error) {
    console.error("Release Assets Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const cancelTradeOrder = async (req, res) => {

  try {
    const { orderId, isTimeout } = req.body;
    const userId = req.user._id;

    if (!orderId) {
      return res.status(400).json({ success: false, message: "Order ID is required" });
    }

    let query;
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      query = { $or: [{ _id: orderId }, { orderId: orderId }, { transactionId: orderId }] };
    } else {
      query = { $or: [{ orderId: orderId }, { transactionId: orderId }] };
    }

    const order = await P2POrder.findOne(query);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.sellerId.toString() !== userId.toString() && order.buyerId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    if (order.status === "completed") {
      return res.status(400).json({ success: false, message: "Order is already completed" });
    }

    if (order.status === "cancelled") {
      return res.status(400).json({ success: false, message: "Order is already cancelled" });
    }

    if (order.status === "timeout") {
      return res.status(400).json({ success: false, message: "Order is already timeout" });
    }

    const previousStatus = order.status;
    order.status = isTimeout ? "timeout" : "cancelled";
    await order.save();

    // Notify via socket for real-time UI update (emit to all room variants)
    try {
      getIO().to(order._id.toString()).emit("p2p_updated");
      if (order.transactionId) getIO().to(order.transactionId.toString()).emit("p2p_updated");
      if (order.orderId) getIO().to(order.orderId.toString()).emit("p2p_updated");
    } catch (err) {
      console.error("Socket emit error:", err);
    }

    // Revert Assets Logic
    // Skip asset reversion if the order was already paid and it's a timeout
    if (isTimeout && previousStatus === "paid") {
      console.log(`Order ${orderId} timed out after payment. Keeping assets locked.`);
    } else {
      const ad = await P2P.findById(order.postId);

      if (ad) {
        // 1. Revert Ad Volume and Locked amount
        ad.volume += order.quantity;
        ad.locked = (ad.locked || 0) - order.quantity;

        if (ad.locked < 0) ad.locked = 0;

        // If ad was completed (out of stock) but now has volume, reactivate it
        if (ad.status === "completed" && ad.volume > 0) {
          ad.status = "active";
        }

        await ad.save();

        // 2. Revert Seller Wallet if Ad side was 'buy'
        if (ad.side === "buy") {
          const sellerWallet = await ownWallet.findOne({
            userId: order.sellerId,
            asset: order.crypto.toUpperCase(),
          });

          if (sellerWallet) {
            sellerWallet.locked -= order.quantity;
            sellerWallet.free += order.quantity;

            if (sellerWallet.locked < 0) sellerWallet.locked = 0;

            sellerWallet.total = sellerWallet.free + sellerWallet.locked;
            await sellerWallet.save();
          }
        }
      }
    }

    const buyerTitle = isTimeout ? "Order Timeout" : "Order Cancelled";
    const buyerMessage = isTimeout
      ? `Order ${order.orderId} for ${order.quantity} ${order.crypto} has timed out.`
      : `Order ${order.orderId} for ${order.quantity} ${order.crypto} has been cancelled.`;

    await sendNotification({
      userId: order.buyerId,
      type: "p2p",
      event: "order_cancelled",
      title: buyerTitle,
      message: buyerMessage,
      referenceId: order._id.toString(),
    });
    logger.notification(`Sending notification to user ${order.buyerId}: ${buyerTitle} - ${buyerMessage}`);


    const sellerTitle = isTimeout ? "Order Timeout" : "Order Cancelled";
    const sellerMessage = isTimeout
      ? `Order ${order.orderId} for ${order.quantity} ${order.crypto} has timed out.`
      : `Order ${order.orderId} for ${order.quantity} ${order.crypto} has been cancelled.`;

    await sendNotification({
      userId: order.sellerId,
      type: "p2p",
      event: "order_cancelled",
      title: sellerTitle,
      message: sellerMessage,
      referenceId: order._id.toString(),
    });
    logger.notification(`Sending notification to user ${order.sellerId}: ${sellerTitle} - ${sellerMessage}`);


    return res.status(200).json({ success: true, message: "Order cancelled successfully" });
  } catch (error) {
    console.error("Cancel Order Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};


const sendP2PMessage = async (req, res) => {
  try {
    const { orderId, text, image } = req.body;
    const userId = req.user._id;

    if (!orderId || (!text && !image)) {
      return res.status(400).json({ success: false, message: "Order ID and message text/image are required" });
    }

    let query;
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      query = { $or: [{ _id: orderId }, { orderId: orderId }, { transactionId: orderId }] };
    } else {
      query = { $or: [{ orderId: orderId }, { transactionId: orderId }] };
    }

    const order = await P2POrder.findOne(query);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Check if user is part of the trade
    if (order.sellerId.toString() !== userId.toString() && order.buyerId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    const newMessage = {
      from: userId,
      text: text || "",
      image: image || "",
      timestamp: new Date(),
    };

    order.messages.push(newMessage);
    await order.save();

    // Notify via socket for real-time UI update (emit to all room variants)
    try {
      getIO().to(order._id.toString()).emit("receive_p2p_msg", newMessage);
      if (order.transactionId) getIO().to(order.transactionId.toString()).emit("receive_p2p_msg", newMessage);
      if (order.orderId) getIO().to(order.orderId.toString()).emit("receive_p2p_msg", newMessage);
    } catch (err) {
      console.error("Socket emit error:", err);
    }

    const recipientId = order.sellerId.toString() === userId.toString() ? order.buyerId : order.sellerId;
    const msgTitle = "New Message";
    const msgContent = text ? (text.length > 50 ? text.substring(0, 50) + "..." : text) : "Sent an image";
    await sendNotification({
      userId: recipientId,
      type: "p2p",
      event: "order_message",
      title: msgTitle,
      message: msgContent,
      referenceId: order._id.toString(),
    });

    logger.notification(`Sending notification to user ${recipientId}: ${msgTitle} - ${msgContent}`);
    return res.status(200).json({
      success: true,
      message: "Message sent",
      result: newMessage
    });
  } catch (error) {
    console.error("Send P2P Message Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};


module.exports = {
  createTradeOrder,
  uploadTradeImage,
  getTradeOrder,
  getOrderById,
  confirmPayment,
  releaseAssets,
  cancelTradeOrder,
  sendP2PMessage
};
