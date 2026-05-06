const User = require('../../models/user')
const { buildErrObject } = require('../../middleware/utils')

/**
 * Checks User model if user with an specific email exists
 * @param {string} email - user email
 */
const emailExists = (email = '') => {
  return new Promise((resolve, reject) => {
    User.findOne(
      {
        email
      },
      (err, item) => {
        if (err) {
          return reject(buildErrObject(400, err.message))
        }

        if (item) {
          return reject(buildErrObject(400, 'Email Already Exists'))
        }
        resolve(false)
      }
    )
  })
}

module.exports = { emailExists }
