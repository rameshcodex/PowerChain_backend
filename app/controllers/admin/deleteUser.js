const User = require("../../models/user");
const { deleteItem, checkBodyString } = require("../../middleware/db");
const { handleError } = require("../../middleware/utils");


/**
 * Delete a user
 */
const deleteUser = async (req, res) => {
    try {
        const id = checkBodyString(req, "id");

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