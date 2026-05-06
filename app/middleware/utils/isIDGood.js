const mongoose = require('mongoose')
const { buildErrObject } = require('./buildErrObject')
const Register = require('../../models/user')

/**
 * Checks if given ID is good for MongoDB
 * @param {string} id - id to check
 */
const isIDGood = async (id = '') => {
  console.log(id, 'id')
  return new Promise(async (resolve, reject) => {
    // const goodID = mongoose.Types.ObjectId.isValid(id)

    const goodID = await Register.findById({ _id: id })

    return goodID ? resolve(id) : reject(buildErrObject(422, 'user not found'))
  })
}

module.exports = { isIDGood }
