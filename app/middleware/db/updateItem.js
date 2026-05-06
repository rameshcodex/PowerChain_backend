const { itemNotFound } = require('../utils')

/**
 * Updates an item in database by id
 * @param {string} id - item id
 * @param {Object} req - request object
 */
const updateItem = (id = '', model = {}, req = {}) => {
  return new Promise(async (resolve, reject) => {
    try {
      const item = await model.findByIdAndUpdate(id, req, {
        new: true,
        runValidators: true
      })
      await itemNotFound(null, item, 'NOT_FOUND')
      resolve(item)
    } catch (error) {
      reject(error)
    }
  })
}

module.exports = { updateItem }
