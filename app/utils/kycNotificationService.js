const User = require("../models/user");
const KYC = require("../models/kyc");
const Notification = require("../models/notification");
const { sendNotification } = require("./notificationHelper");
const { sendOtpEmail } = require("../controllers/auth/helpers.js/sendOtpEmail");

const KYC_COMPLETE_STATUSES = ["pending", "verified"];
const KYC_REMINDER_STATUSES = ["Not Initiated", "rejected"];
const DEFAULT_TIMEZONE = process.env.KYC_REMINDER_TIMEZONE || "Asia/Kolkata";

const normalizeStatus = (status) => String(status || "Not Initiated").toLowerCase();

const getUserDisplayName = (user) => user?.name || user?.username || "User";

const hasSubmittedKyc = (status) => KYC_COMPLETE_STATUSES.includes(normalizeStatus(status));

const shouldRemindForKyc = (status) => {
    const normalized = normalizeStatus(status);
    return KYC_REMINDER_STATUSES.map((value) => value.toLowerCase()).includes(normalized);
};

const sendEmailSafely = ({ checkedEmail, username, subject, html }) => {
    if (!checkedEmail) return;

    sendOtpEmail({
        checkedEmail,
        username,
        subject,
        html,
        temp: "kyc_notification",
    }).catch((error) => {
        console.error("KYC email failed:", error.message);
    });
};

const sendKycReminder = async ({ user, event = "kyc_reminder", email = false }) => {
    if (!user || !shouldRemindForKyc(user.kycStatus)) return null;

    const title = "Complete your KYC";
    const message = "Please submit your KYC to continue using all Power Chain features.";

    const notification = await sendNotification({
        userId: user._id,
        type: "kyc",
        event,
        title,
        message,
    });

    if (email) {
        sendEmailSafely({
            checkedEmail: user.email,
            username: getUserDisplayName(user),
            subject: "Please submit your KYC",
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
                    <h2>KYC Reminder</h2>
                    <p>Hi ${getUserDisplayName(user)},</p>
                    <p>Please submit your KYC to continue using all Power Chain features.</p>
                    <p>You can complete it from your account KYC page.</p>
                    <hr />
                    <p style="font-size: 0.9em; color: #666;">Power Chain Team</p>
                </div>
            `,
        });
    }

    return notification;
};

// const schedulePostLoginKycReminder = (userId) => {
//     setTimeout(async () => {
//         try {
//             const user = await User.findById(userId);
//             if (!user || hasSubmittedKyc(user.kycStatus)) return;

//             await sendKycReminder({ user, event: "kyc_reminder", email: true });
//         } catch (error) {
//             console.error("Post-login KYC reminder failed:", error.message);
//         }
//     }, 2 * 60 * 1000);
// };

// const getNowInTimezone = (timezone) => {
//     const formatter = new Intl.DateTimeFormat("en-CA", {
//         timeZone: timezone,
//         year: "numeric",
//         month: "2-digit",
//         day: "2-digit",
//         hour: "2-digit",
//         minute: "2-digit",
//         hour12: false,
//     });

//     return formatter.formatToParts(new Date()).reduce((acc, part) => {
//         if (part.type !== "literal") acc[part.type] = part.value;
//         return acc;
//     }, {});
// };

// const hasDailyReminderToday = async (userId, dateKey) => {
//     const referenceId = `kyc-daily-${dateKey}`;

//     return Notification.exists({
//         user: userId,
//         event: "kyc_daily_reminder",
//         referenceId,
//     });
// };

// const runDailyKycReminder = async ({ timezone = DEFAULT_TIMEZONE } = {}) => {
//     const now = getNowInTimezone(timezone);
//     const dateKey = `${now.year}-${now.month}-${now.day}`;

//     const users = await User.find({
//         role: "user",
//         kycStatus: { $in: KYC_REMINDER_STATUSES },
//     });

//     for (const user of users) {
//         const alreadySent = await hasDailyReminderToday(user._id, dateKey);
//         if (alreadySent) continue;

//         await sendNotification({
//             userId: user._id,
//             type: "kyc",
//             event: "kyc_daily_reminder",
//             title: "KYC reminder",
//             message: "Please submit your KYC.",
//             referenceId: `kyc-daily-${dateKey}`,
//         });
//     }
// };

// const startDailyKycReminderJob = ({ timezone = DEFAULT_TIMEZONE } = {}) => {
//     let lastRunDateKey = null;

//     const tick = async () => {
//         try {
//             const now = getNowInTimezone(timezone);
//             const dateKey = `${now.year}-${now.month}-${now.day}`;

//             if (now.hour === "10" && now.minute === "00" && lastRunDateKey !== dateKey) {
//                 lastRunDateKey = dateKey;
//                 await runDailyKycReminder({ timezone });
//             }
//         } catch (error) {
//             console.error("Daily KYC reminder job failed:", error.message);
//         }
//     };

//     setInterval(tick, 60 * 1000);
//     tick();
// };

const notifyKycStatusChanged = async ({ kycId, status, rejectionReason }) => {
    const normalizedStatus = normalizeStatus(status);
    const event = normalizedStatus === "verified" ? "kyc_approved" : "kyc_rejected";
    const title = normalizedStatus === "verified" ? "KYC approved" : "KYC rejected";
    const message =
        normalizedStatus === "verified"
            ? "Your KYC has been approved."
            : `Your KYC has been rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ""}`;

    const kyc = await KYC.findById(kycId).populate("userId");
    const user = kyc?.userId;

    if (!user) return;

    await sendNotification({
        userId: user._id,
        type: "kyc",
        event,
        title,
        message,
        referenceId: String(kycId),
    });

    sendEmailSafely({
        checkedEmail: user.email,
        username: getUserDisplayName(user),
        subject: title,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
                <h2>${title}</h2>
                <p>Hi ${getUserDisplayName(user)},</p>
                <p>${message}</p>
                <hr />
                <p style="font-size: 0.9em; color: #666;">Power Chain Team</p>
            </div>
        `,
    });
};

module.exports = {
    // schedulePostLoginKycReminder,
    notifyKycStatusChanged,
};
