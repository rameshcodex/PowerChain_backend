const { buildErrObject } = require('../utils')

/**
 * Creates a new item in database
 * @param {Object} req - request object
 */
const createItem = (req = {}, model = {}) => {
  return new Promise(async (resolve, reject) => {
    try {
      const item = await model.create(req)
      resolve(item)
    } catch (err) {
      reject(buildErrObject(422, err.message))
    }
  })
}

module.exports = { createItem }
