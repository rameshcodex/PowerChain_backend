const User = require("../../models/user");
const { getItems, getItem, updateItem, deleteItem, checkQueryString } = require("../../middleware/db");
const { handleError } = require("../../middleware/utils");



/**
 * Update user status (active/inactive)
 */
const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        user.status = !user.status;
        await user.save();

        res.status(200).json({
            success: true,
            result: user,
            message: `User status updated to ${user.status} successfully`
        });
    } catch (error) {
        handleError(res, error);
    }
}

const updateUserTradeStatus = async (req, res) => {
    try {
        const { id } = req.query;
        const { tradeStatus } = req.body;

        if (![true, false].includes(tradeStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Must be true or false."
            });
        }

        const user = await updateItem(id, User, { tradeStatus });

        res.status(200).json({
            success: true,
            result: user,
            message: `User trade status updated to ${tradeStatus} successfully`
        });
    } catch (error) {
        handleError(res, error);
    }
}

module.exports = {
    updateUserStatus,
    updateUserTradeStatus
}