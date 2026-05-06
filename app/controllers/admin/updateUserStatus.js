const User = require("../../models/user");
const { updateItem, checkBodyString } = require("../../middleware/db");
const { handleError } = require("../../middleware/utils");



/**
 * Update user status (active/inactive)
 */
const updateUserStatus = async (req, res) => {
    try {
        const id = checkBodyString(req, "id");
        const status = req.body?.status || "";

        const user = await updateItem(id, User, { status });

        res.status(200).json({
            success: true,
            result: user,
            message: `User status updated to ${status} successfully`
        });
    } catch (error) {
        handleError(res, error);
    }
}

module.exports = {
    updateUserStatus
}