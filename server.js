// require('./utils/cache-optimizer');
require('dotenv-safe').config();
const express = require('express');
const bodyparser = require('body-parser');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('passport');
const path = require('path');
const i18n = require('i18n');
const mongoose = require('mongoose');
const initMongo = require('./config/mongo')
const router = require('./app/routes/auth');
const binanceRoute = require('./app/routes/binance');
const okxRoutes = require('./app/routes/okx');
const adminRoutes = require('./app/routes/admin');
const { log } = require('console');
// const passport = require("./config/passport")
const session = require("express-session")
const crypto = require('crypto');
const { initSocket } = require('./app/controllers/Ticket/socket/TicketMessSocket');
const { setupP2PSocket } = require('./app/controllers/auth/p2p/socket/p2pSocketHandler');
const { encryptPayload, decryptPayload } = require('./app/middleware/payloadEncrypt')
const { connectToRabbitMQ, getChannel } = require('./app/helper/rabbitmq')

require('./config/googleStrategy')

const app = express();
const port = process.env.PORT || 3000;

// Create HTTP server for Socket.IO
const http = require('http');
const httpServer = http.createServer(app);

// Initialize Socket.IO
const io = initSocket(httpServer);
setupP2PSocket(io);


// Make io accessible to routes
app.set('io', io);

app.use(express.json());
app.use(passport.initialize())
// app.use(express.urlencoded({ extended: true }));

app.use(bodyparser.json(
    {
        limit: '20mb'
    }
));

app.use(bodyparser.urlencoded(
    {
        limit: '20mb',
        extended: true
    }
));

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "https://optiontrade.net"
];

i18n.configure({
    locales: ['en', 'ar'],
    directory: `${__dirname}/locales`,
    defaultLocale: 'en',
    objectNotation: true
});

app.use(i18n.init);

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))



process.on('uncaughtException', (error, origin) => {
    console.log("Uncaught Exception");
    console.log(error);
    console.log(origin);
});

process.on('unhandledRejection', (reason, promise) => {
    console.log("Unhandled Rejection");
    console.log(reason);
    console.log(promise);
});


// // Middle Ware to decrypt payload
// app.use((req, res, next) => {
//     try {
//         // decrypt payload
//         if (req.body) {
//             const decryptedData = decryptPayload(req.body.data)

//             // store decrypted data in req.body
//             req.body = decryptedData;
//         }
//         next();
//     } catch (error) {
//         return res.status(400).json({
//             success: false,
//             message: "Request decryption failed",
//         });
//     }
// })

// // Middle Ware to encrypt payload
// app.use((req, res, next) => {
//     // store original res.json
//     const originalJson = res.json.bind(res);

//     // override res.json
//     res.json = (payload) => {
//         try {
//             // encrypt payload
//             const encryptedData = encryptPayload(payload)

//             // send encrypted response
//             return originalJson({
//                 data: encryptedData,
//             });

//         } catch (error) {
//             return originalJson({
//                 success: false,
//                 message: "Response encryption failed",
//             });
//         }
//     };

//     next();
// });

app.use(compression())
// Configure Helmet to allow cross-origin images


app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}))
app.use(morgan('dev'))

app.use(passport.initialize())

app.use(
    session({
        name: "captcha.sid",
        secret: "captcha_secret_key",
        resave: false,
        saveUninitialized: true,
        cookie: {
            httpOnly: true,
            secure: false, // true only in HTTPS
            sameSite: "lax",
        },
    })
);

//  STATIC FILES
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(require("./app/routes"));

app.use(express.static(path.join(__dirname, 'views')))
app.engine('html', require('ejs').renderFile)
app.set('view engine', 'html')

// Listen on HTTP server instead of app
httpServer.listen(port, () => {
    log(`Server started on port ${port}`)
    log(`Socket.IO initialized`)
})
initMongo();
// connectToRabbitMQ();

mongoose.connection.once('open', () => {
    // startNotificationConsumer().catch((error) => {
    //     console.error('Failed to start RabbitMQ notification consumer:', error.message);
    // });
});
// startDailyKycReminderJob();
module.exports = app
