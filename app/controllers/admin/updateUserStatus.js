const User = require("../../models/user");
const { getItems, getItem, updateItem, deleteItem, checkQueryString } = require("../../middleware/db");
const { handleError } = require("../../middleware/utils");



/**
 * Update user status (active/inactive)
 */
const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.query;
        const { status } = req.body;

        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Must be 'active' or 'inactive'."
            });
        }

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