const User = require('../models/user')
const Admin = require('../models/admin')
const { itemNotFound, buildErrObject } = require('../middleware/utils')

const isBuiltError = (e) =>
    e &&
    typeof e === 'object' &&
    typeof e.code === 'number' &&
    e.message != null

/**
 * Checks against user if has quested role
 * @param {Object} data - data object
 * @param {*} next - next callback
 */
const checkPermissions = async ({ id = '', roles = [] }, next) => {
    try {
        const user = await User.findById(id).exec()
        if (!user) {
            const admin = await Admin.findById(id).exec()
            await itemNotFound(null, admin, 'ADMIN NOT FOUND')
            const adminRole = admin.role != null ? String(admin.role) : ''
            if (roles.indexOf(adminRole) > -1) {
                return next()
            }
            throw buildErrObject(401, 'UNAUTHORddddddddddddIZED')
        }
        await itemNotFound(null, user, 'USER NOT FOUND')
        const userRole =
            user.role != null && user.role !== ''
                ? String(user.role)
                : 'user'
        if (roles.indexOf(userRole) > -1) {
            return next()
        }
        throw buildErrObject(401, 'UNAUTH33333ORIZED')
    } catch (error) {
        if (isBuiltError(error)) {
            throw error
        }
        throw buildErrObject(500, error?.message || 'Permission check failed')
    }
}

module.exports = { checkPermissions }
