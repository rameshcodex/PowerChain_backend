const mongoose = require('mongoose')
const DB_URL = process.env.MONGO_URI
const loadModel = require('../app/models')

module.exports = () => {
    const connect = async () => {
        try {
            await mongoose.connect(DB_URL,
                {
                    maxPoolSize: 50,
                    minPoolSize: 10,
                    maxIdleTimeMS: 60000,
                    serverSelectionTimeoutMS: 5000,
                    socketTimeoutMS: 45000,
                    connectTimeoutMS: 10000,
                    retryWrites: true,
                    retryReads: true,
                }
            )

            if (process.env.NODE_ENV !== 'dev') {
                console.log("****************************")
                console.log('    Server Started')
                console.log(`    port: ${process.env.PORT || 3000}`)
                console.log(`    NODE_ENV: ${process.env.NODE_ENV}`)
                console.log('    Database: MongoDB')
                console.log('    DB Connected')
                console.log("****************************")
            }
        } catch (err) {
            console.log('Mongo URI:', DB_URL)
            console.error('❌ MongoDB connection error')
            console.error(err)
            process.exit(1)
        }
    }

    connect()

    mongoose.connection.on('error', console.error)
    mongoose.connection.on('disconnected', connect)

    loadModel()
}
