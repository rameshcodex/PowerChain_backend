const Notification = require('../../models/notification')
const { createItem } = require('./createItem')
const createNotification = async (payload) => {
  try {
    const notification = await createItem(payload, Notification)
    return true
  } catch (error) {
    console.log(error)
    return false
  }
}

module.exports = createNotification
