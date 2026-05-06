const { itemNotFound } = require('../utils')

/**
 * Gets item from database by id
 * @param {string} id - item id
 */
const getItemById = (id = '', model = {}) => {
  return new Promise(async (resolve, reject) => {
    try {
      const item = await model.findById(id)
      await itemNotFound(null, item, 'NOT_FOUND')
      resolve(item)
    } catch (error) {
      reject(error)
    }
  })
}

module.exports = { getItemById }
