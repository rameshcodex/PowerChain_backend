const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: ["p2p", "spot", "support", "user", "fund", "kyc"],
            required: true,
        },
        event: {
            type: String,
            enum: [
                "post_created",
                "post_cancelled",
                "order_created",
                "order_paid",
                "asset_released",
                "order_cancelled",
                "order_message",
                "new_message",
                "support_message",
                "support_created",
                "password_changed",
                "2fa_enabled",
                "2fa_disabled",
                "withdrawal_initiated",
                "deposit_confirmed",
                "kyc_reminder",
                "kyc_daily_reminder",
                "kyc_submitted",
                "kyc_approved",
                "kyc_rejected"
            ],
            required: true,
        },
        title: {
            type: String,
        },
        message: {
            type: String,
        },
        referenceId: {
            type: String,
            default: null,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

notificationSchema.index({ user: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
