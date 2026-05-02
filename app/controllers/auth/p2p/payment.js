const PaymentMethod = require("../../../models/paymentMethod");
const P2P = require("../../../models/p2p");
const { deleteFile } = require("../../../middleware/upload");




// const addPaymentMethod = async (req, res) => {
//     try {
//         const { type, upiId, ifsc, bankName, accountNumber, accHolderName, qrCode, isDefault, accountType, bankBranch } = req.body;

//         if (isDefault) {
//             await PaymentMethod.updateMany(
//                 { userId: req.user._id },
//                 { $set: { isDefault: false } }
//             );
//         }

//         const existing = await PaymentMethod.findOne({
//             userId: req.user._id,
//             $or: [
//                 ...(upiId ? [{ upiId }] : []),
//                 ...(accountNumber ? [{ accountNumber }] : [])
//             ]
//         });
//         if (existing && upiId && existing.upiId === upiId) {
//             return res.status(400).json({
//                 success: false,
//                 result: [],
//                 message: "UPI ID already exists",
//             });
//         }

//         if (existing && accountNumber && existing.accountNumber === accountNumber) {
//             return res.status(400).json({
//                 success: false,
//                 result: [],
//                 message: "Account Number already exists",
//             });
//         }

//         const newPaymentMethod = new PaymentMethod({
//             userId: req.user._id,
//             type,
//             accHolderName,
//             upiId,
//             ifsc,
//             bankName,
//             accountNumber,
//             qrCode,
//             isDefault: isDefault || false,
//             accountType,
//             bankBranch
//         });

//         await newPaymentMethod.save();

//         res.status(201).json({
//             success: true,
//             message: "Payment method added successfully",
//             reCANCELLEDsult: newPaymentMethod,
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: "Failed to add payment method",
//             error: error.message,
//         });
//     }
// };
const addPaymentMethod = async (req, res) => {
  try {
    const {
      type,
      upiId,
      ifsc,
      bankName,
      accountNumber,
      accHolderName,
      qrCode,
      isDefault,
      accountType,
      bankBranch,
    } = req.body;

    // Check if user already has payment methods
    const userPaymentCount = await PaymentMethod.countDocuments({
      userId: req.user._id,
    });

    let defaultFlag = isDefault || false;

    // If first payment method, make it default
    if (userPaymentCount === 0) {
      defaultFlag = true;
    }

    // If user explicitly sets isDefault=true, unset others
    if (defaultFlag) {
      await PaymentMethod.updateMany(
        { userId: req.user._id },
        { $set: { isDefault: false } }
      );
    }

    // Check duplicates
    const existing = await PaymentMethod.findOne({
      userId: req.user._id,
      $or: [
        ...(upiId ? [{ upiId }] : []),
        ...(accountNumber ? [{ accountNumber }] : []),
      ],
    });

    if (existing && upiId && existing.upiId === upiId) {
      return res.status(400).json({
        success: false,
        result: [],
        message: "UPI ID already exists",
      });
    }

    if (existing && accountNumber && existing.accountNumber === accountNumber) {
      return res.status(400).json({
        success: false,
        result: [],
        message: "Account Number already exists",
      });
    }

    // Create payment method
    const newPaymentMethod = new PaymentMethod({
      userId: req.user._id,
      type,
      accHolderName,
      upiId,
      ifsc,
      bankName,
      accountNumber,
      qrCode,
      isDefault: defaultFlag,
      accountType,
      bankBranch,
    });

    await newPaymentMethod.save();

    res.status(201).json({
      success: true,
      message: "Payment method added successfully",
      result: newPaymentMethod,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add payment method",
      error: error.message,
    });
  }
};

const getPaymentTypes = async (req, res) => {
  try {
    const paymentTypes = PaymentMethod.schema.path("type").enumValues;
    res.status(200).json({
      success: true,
      result: paymentTypes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment types",
      error: error.message,
    });
  }
};

const getPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = await PaymentMethod.find({
      userId: req.user._id,
      status: "active"
    }).select("-__v -userId").lean();

    res.status(200).json({
      success: true,
      result: paymentMethods,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment methods",
      error: error.message,
    });
  }
};


const updatePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existingPaymentMethod = await PaymentMethod.findOne({ _id: id, userId: req.user._id });
    if (!existingPaymentMethod) {
      return res.status(404).json({
        success: false,
        message: "Payment method not found or unauthorized",
      });
    }

    // Check duplicates if upiId or accountNumber is being updated
    if (updates.upiId || updates.accountNumber) {
      const duplicate = await PaymentMethod.findOne({
        userId: req.user._id,
        _id: { $ne: id },
        $or: [
          ...(updates.upiId ? [{ upiId: updates.upiId }] : []),
          ...(updates.accountNumber ? [{ accountNumber: updates.accountNumber }] : []),
        ],
      });

      if (duplicate) {
        if (updates.upiId && duplicate.upiId === updates.upiId) {
          return res.status(400).json({
            success: false,
            message: "UPI ID already exists",
          });
        }
        if (updates.accountNumber && duplicate.accountNumber === updates.accountNumber) {
          return res.status(400).json({
            success: false,
            message: "Account Number already exists",
          });
        }
      }
    }

    // If qrCode is being updated and there's an old one, delete it
    // if (updates.qrCode && existingPaymentMethod.qrCode && updates.qrCode !== existingPaymentMethod.qrCode) {
    if (existingPaymentMethod.qrCode && updates.qrCode !== undefined && updates.qrCode !== existingPaymentMethod.qrCode) {
      deleteFile(existingPaymentMethod.qrCode);
    }

    if (updates.isDefault) {
      await PaymentMethod.updateMany(
        { userId: req.user._id, _id: { $ne: id } },
        { $set: { isDefault: false } }
      );
    }

    const paymentMethod = await PaymentMethod.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    const response = paymentMethod.toObject();
    delete response.__v;
    delete response.userId;

    res.status(200).json({
      success: true,
      message: "Payment method updated successfully",
      result: response,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update payment method",
      error: error.message,
    });
  }
};

const paymentMethodStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const paymentMethod = await PaymentMethod.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { $set: { status } },
      { new: true }
    );
    const response = paymentMethod.toObject();
    delete response.__v;
    delete response.userId;

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: "Payment method not found or unauthorized",
      });
    }

    res.status(200).json({
      success: true,
      message: `Payment method ${status} successfully`,
      result: response,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update payment method status",
      error: error.message,
    });
  }
};




// const deletePaymentMethod = async (req, res) => {
//     try {
//         const { id } = req.params;

//         const linkedPost = await P2P.findOne({
//             paymentMethod: id,
//             status: { $nin: ["closed", "cancelled"] }
//         });

//         if (linkedPost) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Cannot delete payment method as it is linked to an active or open P2P post. Please close or cancel the post first.",
//             });
//         }

//         const paymentMethod = await PaymentMethod.findOne({
//             _id: id,
//             userId: req.user._id
//         });

//         if (!paymentMethod) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Payment method not found or unauthorized",
//             });
//         }

//         // Delete associated image if it exists
//         if (paymentMethod.qrCode) {
//             deleteFile(paymentMethod.qrCode);
//         }

//         await PaymentMethod.deleteOne({ _id: id });

//         res.status(200).json({
//             success: true,
//             message: "Payment method deleted successfully",
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: "Failed to delete payment method",
//             error: error.message,
//         });
//     }
// };
const deletePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if linked to active P2P post
    const linkedPost = await P2P.findOne({
      paymentMethod: id,
      status: { $nin: ["closed", "cancelled"] }
    });

    if (linkedPost) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete payment method as it is linked to an active or open P2P post. Please close or cancel the post first.",
      });
    }

    const paymentMethod = await PaymentMethod.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: "Payment method not found or unauthorized",
      });
    }

    // Check how many payment methods the user has
    const totalMethods = await PaymentMethod.countDocuments({ userId: req.user._id });

    // Prevent deletion if only 1 method remains
    if (totalMethods === 1) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete the only payment method. You must have at least one payment method.",
      });
    }

    // Delete associated QR code file if exists
    if (paymentMethod.qrCode) {
      deleteFile(paymentMethod.qrCode);
    }

    // Delete the payment method
    await PaymentMethod.deleteOne({ _id: id });

    // If deleted method was default, make another one default
    if (paymentMethod.isDefault) {
      const remainingMethod = await PaymentMethod.findOne({ userId: req.user._id });
      if (remainingMethod) {
        remainingMethod.isDefault = true;
        await remainingMethod.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Payment method deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete payment method",
      error: error.message,
    });
  }
};



module.exports = {
  addPaymentMethod,
  getPaymentMethods,
  updatePaymentMethod,
  deletePaymentMethod,
  getPaymentTypes,
  paymentMethodStatus
};

