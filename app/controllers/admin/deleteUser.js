const User = require("../../models/user");
const { getItems, getItem, updateItem, deleteItem, checkQueryString } = require("../../middleware/db");
const { handleError } = require("../../middleware/utils");


/**
 * Delete a user
 */
const deleteUser = async (req, res) => {
    try {
        const { id } = req.query;

        await deleteItem(id, User);

        res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });
    } catch (error) {
        handleError(res, error);
    }
}

module.exports = {
    deleteUser
}