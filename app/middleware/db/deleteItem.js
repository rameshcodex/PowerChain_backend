const { buildSuccObject, itemNotFound } = require('../utils')

/**
 * Deletes an item from database by id
 * @param {string} id - id of item
 */
const deleteItem = (id = '', model = {}) => {
  return new Promise(async (resolve, reject) => {
    try {
      const item = await model.findByIdAndDelete(id)
      await itemNotFound(null, item, 'NOT_FOUND')
      resolve(buildSuccObject('DELETED'))
    } catch (error) {
      reject(error)
    }
  })
}

module.exports = { deleteItem }
