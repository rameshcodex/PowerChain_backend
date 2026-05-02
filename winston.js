
const winston = require('winston');

// Define custom log levels
const customLevels = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        wallet: 3, // New custom level
        trade: 4,
        universalTransfer: 5,
        debug: 6,
        notification: 7
    },
    colors: {
        error: 'red',
        warn: 'yellow',
        info: 'green',
        debug: 'blue',
        wallet: 'blue', // Custom log level color
        trade: 'blue', // Custom log level color
        universalTransfer: 'blue',
        notification: 'green' 
    }
};

// Apply the colors to Winston
winston.addColors(customLevels.colors);

// Create custom formats for filtering logs
const errorFilter = winston.format((info) => {
    return info.level === 'error' ? info : false;
});

const infoFilter = winston.format((info) => {
    return info.level === 'info' ? info : false;
});

const walletFilter = winston.format((info) => {
    return info.level === 'wallet' ? info : false;
});

const notificationFilter = winston.format((info) => {
    return info.level === 'notification' ? info : false;
});
const tradeFilter = winston.format((info) => {
    return info.level === 'trade' ? info : false;
});

const unitransferFilter = winston.format((info) => {
    return info.level === 'universalTransfer' ? info : false;
});


const debugFilter = winston.format((info) => {
    return info.level === 'debug' ? info : false;
});

// Create the logger
const logger = winston.createLogger({
    levels: customLevels.levels,
    level: 'debug', // Default log level
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({
            filename: 'logs/info.log',
            level: 'info',
            format: winston.format.combine(infoFilter(), winston.format.timestamp(), winston.format.json())
        }),
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: winston.format.combine(errorFilter(), winston.format.timestamp(), winston.format.json())
        }),
        new winston.transports.File({
            filename: 'logs/wallet.log',
            level: 'wallet',
            format: winston.format.combine(walletFilter(), winston.format.timestamp(), winston.format.json())
        }),
        new winston.transports.File({
            filename: 'logs/universalTransfer.log',
            level: 'universalTransfer',
            format: winston.format.combine(unitransferFilter(), winston.format.timestamp(), winston.format.json())
        }),
        new winston.transports.File({
            filename: 'logs/trade.log',
            level: 'trade',
            format: winston.format.combine(tradeFilter(), winston.format.timestamp(), winston.format.json())
        }),

        new winston.transports.File({
            filename: 'logs/debug.log',
            level: 'debug',
            format: winston.format.combine(debugFilter(), winston.format.timestamp(), winston.format.json())
        }),
       new winston.transports.File({
            filename: 'logs/notification.log',
            level: 'notification',
            format: winston.format.combine(notificationFilter(), winston.format.timestamp(), winston.format.json())
        }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ],
});
module.exports = { logger };