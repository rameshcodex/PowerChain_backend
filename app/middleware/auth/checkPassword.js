// const parseWithScope = require('babel-eslint/lib/parse-with-scope')
const { buildErrObject } = require('../../middleware/utils')

/**
 * Checks is password matches
 * @param {string} password - password
 * @param {Object} user - user object
 * @returns {boolean}
 */
const checkPassword = (password = '', user = {}) => {
  // console.log(password,user,'log');
  return new Promise((resolve, reject) => {
    user.comparePassword(password, (err, isMatch) => {
      // console.log(isMatch,'ismatch');
      if (err) {
        return reject(buildErrObject(400, err.message))
      }
      if (!isMatch) {
        return reject(buildErrObject(400, 'Incorrect password'))
        // return !admin ? done(null, false) : done(null, admin)
      }
      resolve(true)
    })
  })
}

module.exports = { checkPassword }
