const mongoose = require('mongoose')
const DB_URL = process.env.MONGO_URI
const loadModel = require('../app/models')

module.exports = () => {
    const connect = async () => {
        try {
            console.log("khikhiohioh")
            await mongoose.connect(DB_URL)

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
