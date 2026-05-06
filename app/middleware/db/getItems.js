const { buildErrObject } = require('../utils')

const { listInitOptions } = require('./listInitOptions')
const { cleanPaginationID } = require('./cleanPaginationID')

/**
 * Gets items from database
 * @param {Object} req - request object
 * @param {Object} query - query object
 */
const getItems = async (req = {}, model = {}, query = {}) => {
  const options = await listInitOptions(req)
  return new Promise(async (resolve, reject) => {
    try {
      const items = await model.paginate(query, options)
      resolve(cleanPaginationID(items))
    } catch (err) {
      reject(buildErrObject(422, err.message))
    }
  })
}

module.exports = { getItems }
