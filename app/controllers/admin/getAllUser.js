const User = require("../../models/user");
const { getItems, getItem, updateItem, deleteItem, checkQueryString } = require("../../middleware/db");
const { handleError } = require("../../middleware/utils");

/**
 * Get all users with pagination and filters
 */
const getAllUsers = async (req, res) => {
    try {
        const query = await checkQueryString(req.query);
        const status = req.query.status || "";

        // query.isDeleted = { $ne: true };

        if (status) query.status = status;

        res.status(200).json(await getItems(req, User, query));
    } catch (error) {
        handleError(res, error);
    }
};


module.exports = {
    getAllUsers
};