const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        userId: {
            type: String,
        },
        type: {
            type: String,
            enum: ["p2p", "spot", "support", "user", "fund", "kyc"],
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
                "login_success",
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
        },
        category: {
            type: String,
        },
        eventType: {
            type: String,
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
        priority: {
            type: String,
        },
        action: {
            type: mongoose.Schema.Types.Mixed,
            default: { type: "NONE" },
        },
        data: {
            type: mongoose.Schema.Types.Mixed,
        },
        deliveries: {
            type: Array,
            default: [],
        },
        expiresAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

notificationSchema.index({ user: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
