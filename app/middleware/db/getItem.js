const { itemNotFound } = require('../utils')

/**
 * Gets item from database by id
 * @param {string} id - item id
 */
const getItem = (query = {}, model = {}) => {
  return new Promise(async (resolve, reject) => {
    try {
      const item = await model.findOne(query)
      await itemNotFound(null, item, 'NOT_FOUND')
      resolve(item)
    } catch (error) {
      reject(error)
    }
  })
}

module.exports = { getItem }
