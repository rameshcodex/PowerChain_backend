const { buildErrObject } = require('../utils')

/**
 * Checks the request body for filtering records or extracts a specific field
 * @param {Object} reqOrBody - request or body object
 * @param {string} [field] - optional field name to extract
 */
const checkBodyString = (reqOrBody = {}, field) => {
  // If field is provided, act as a getter (sync)
  if (field) {
    if (reqOrBody && reqOrBody.body && typeof reqOrBody.body[field] !== 'undefined') {
      return reqOrBody.body[field]
    }
    if (reqOrBody && reqOrBody.query && typeof reqOrBody.query[field] !== 'undefined') {
      return reqOrBody.query[field]
    }
    if (reqOrBody && reqOrBody.params && typeof reqOrBody.params[field] !== 'undefined') {
      return reqOrBody.params[field]
    }
    return ""
  }

  // Filter builder mode (async)
  return new Promise((resolve, reject) => {
    try {
      const body = reqOrBody
      if (
        typeof body.filter !== 'undefined' &&
        typeof body.fields !== 'undefined'
      ) {
        const data = {
          $or: []
        }
        const array = []
        // Takes fields param and builds an array by splitting with ','
        const arrayFields = body.fields.split(',')
        // Adds SQL Like %word% with regex
        arrayFields.map((item) => {
          array.push({
            [item]: {
              $regex: new RegExp(body.filter, 'i')
            }
          })
        })
        // Puts array result in data
        data.$or = array
        resolve(data)
      } else {
        resolve({})
      }
    } catch (err) {
      // console.log(err.message)
      reject(buildErrObject(422, 'ERROR_WITH_FILTER'))
    }
  })
}

module.exports = { checkBodyString }
