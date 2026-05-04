const User = require('../models/user')
const Admin = require('../models/admin')
const { itemNotFound, buildErrObject } = require('../middleware/utiles')

/**
 * Checks against user if has quested role
 * @param {Object} data - data object
 * @param {*} next - next callback
 */
const checkPermissions = ({ id = '', roles = [] }, next) => {
    return new Promise((resolve, reject) => {
        User.findById(id, async (err, result) => {
            try {
                if (!result) {
                    Admin.findById(id, async (err, result) => {
                        await itemNotFound(err, result, 'ADMIN NOT FOUND')
                        if (roles.indexOf(result.role) > -1) {
                            return resolve(next())
                        }
                        reject(buildErrObject(401, 'UNAUTHORddddddddddddIZED'))
                    })
                } else {
                    await itemNotFound(err, result, 'USER NOT FOUND')
                    console.log('User Role:', result.role) // Debug log
                    if (roles.indexOf(result.role) > -1) {
                        return resolve(next())
                    }
                    console.log('User Role:', result.role) // Debug log
                    reject(buildErrObject(401, 'UNAUTH33333ORIZED'))
                }
            } catch (error) {
                reject(error)
            }
        })
    })
}

module.exports = { checkPermissions }
