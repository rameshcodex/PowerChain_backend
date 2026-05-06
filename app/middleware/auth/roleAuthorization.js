const { checkPermissions, checkAdminPermissions } = require('../../helper')

const { handleError } = require('../../middleware/utils')

/**
 * Roles authorization function called by route
 * @param {Array} roles - roles specified on the route
 */
const roleAuthorization = (roles) => async (req, res, next) => {
    try {
        const data = {
            id: req.user._id,
            roles
        }

        console.log('Role Authorization Data:', data) // Debug log
        // if (roles[0] == 'user') {
        await checkPermissions(data, next)
        // } else {
        //   await checkAdminPermissions(data, next)
        // }

    } catch (error) {
        handleError(res, error)
    }
}

module.exports = { roleAuthorization }
