const User = require("../../models/user");
const { getItem, checkBodyString } = require("../../middleware/db");
const { handleError } = require("../../middleware/utils");

/**
 * Get single user details by ID
 */
const getUserById = async (req, res) => {
    try {
        const id = checkBodyString(req, "id");

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "User ID is required in query parameters"
            });
        }

        const user = await getItem({ _id: id, isDeleted: { $ne: true } }, User);

        res.status(200).json({
            success: true,
            result: user,
            message: "User details fetched successfully"
        });
    } catch (error) {
        handleError(res, error);
    }
}

module.exports = {
    getUserById
}
