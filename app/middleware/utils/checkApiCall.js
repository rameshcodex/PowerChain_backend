const IORedis = require('ioredis');
const { getIP } = require('./getIP');
const User = require('../../models/user');
const Notification = require('../../models/notification');
// const TradeSettingsModel = require('../../models/tradeSettings');

// Default fallback configuration for ioredis
const redis = new IORedis(process.env.REDIS_URL || {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
});

let cachedBotSettings = null;
let lastBotCacheUpdate = 0;

// const getBotThresholds = async () => {
//     const now = Date.now();
//     if (cachedBotSettings && (now - lastBotCacheUpdate < 60000)) {
//         return cachedBotSettings;
//     }
//     try {
//         const settings = await TradeSettingsModel.findOne({ type: 'tapTrade' });
//         cachedBotSettings = {
//             perMin: settings?.botDetectPerMin || 25,
//             perSec: settings?.botDetectPerSecond || 200
//         };
//         lastBotCacheUpdate = now;
//         return cachedBotSettings;
//     } catch (e) {
//         return { perMin: 25, perSec: 200 };
//     }
// };

const checkApiCall = async (req, res, next) => {
    try {
        const ip = getIP(req);
        const userAgent = req.headers['user-agent'] || '';

        // 1. Block known bots
        if (/bot|curl|postman|python/i.test(userAgent)) {
            return res.status(403).json({
                success: false,
                message: 'Bot access denied'
            });
        }

        const thresholds = await getBotThresholds();

        // 2. Speed check
        // ONLY check speed for ACTUALLY performative POST/action requests.
        // Ignore "fetch style" requests (results, history, etc.) even if they are POST.
        const isActionRequest = req.method !== 'GET' && 
                                !req.originalUrl.includes('result') && 
                                !req.originalUrl.includes('History') && 
                                !req.originalUrl.includes('get-') && 
                                !req.originalUrl.includes('getWallet');

        if (isActionRequest) {
            const lastKey = `ip:${ip}:last`;
            const last = await redis.get(lastKey);
            const now = Date.now();

            // Prevent rapid multiple hits in < thresholds.perSec (default 200ms)
            if (last && (now - parseInt(last) < thresholds.perSec)) {
                if (req.user && (req.user._id || req.user.id)) {
                    const userId = req.user._id || req.user.id;
                    await User.findByIdAndUpdate(userId, {
                        highlowStatus: false,
                        highlowSpreadStatus: false,
                        spinAndWinStatus: false,
                        tapTradeStatus: false,
                        updownStatus: false
                    });

                    await Notification.create({
                        from: userId,
                        type: 'user',
                        message: `User was Automatically Blocked due to suspicious speed hits (<${thresholds.perSec}ms).`
                    });
                }

                return res.status(429).json({
                    success: false,
                    message: 'Your account is blocked'
                });
            }
            await redis.set(lastKey, now);
        }

        // Ensure it's a real hit, not just preflight
        if (req.method === 'OPTIONS') return next();

        // 3. User-based tracking and continuous spam check
        // Rate limit per User if logged in (Focusing on ACTIONS only so we don't count GET or fetch requests towards limit)
        if (req.user && (req.user._id || req.user.id)) {
            const userId = req.user._id || req.user.id;

            if (isActionRequest) {
                const userKey = `user:${userId}:hits`;

                const userHits = await redis.incr(userKey);
                if (userHits === 1) {
                    await redis.expire(userKey, 60);
                }

                // If user is sending crazy continuous action traffic (>=thresholds.perMin)
                if (userHits >= thresholds.perMin) {
                    const user = await User.findById(userId);
                    if (user) {
                        // Block the user from trading specifically immediately
                        await User.findByIdAndUpdate(userId, {
                            highlowStatus: false,
                            highlowSpreadStatus: false,
                            spinAndWinStatus: false,
                            tapTradeStatus: false,
                            updownStatus: false
                        });

                        // Notify admin about the block
                        await Notification.create({
                            from: userId,
                            type: 'user',
                            message: `User ${user.email} was Automatically Blocked due to suspicious(BOT) activity (Hits: ${userHits}/${thresholds.perMin}).`
                        });
                    }

                    return res.status(429).json({
                        success: false,
                        message: 'You are blocked raise a ticket'
                    });
                }
            }
        } else {
            // Rate limit per IP for non-authenticated hits
            const ipKey = `ip:${ip}:hits`;
            const ipHits = await redis.incr(ipKey);
            if (ipHits === 1) {
                await redis.expire(ipKey, 60);
            }
            if (ipHits > 60) {
                return res.status(429).json({
                    success: false,
                    message: 'Too many requests (Bot detected)'
                });
            }
        }

        next();
    } catch (error) {
        console.error('API Check Error:', error);
        next();
    }
};

module.exports = { checkApiCall };
