const User = require("../../models/user");
const { getItems, getItem, updateItem, deleteItem, checkQueryString } = require("../../middleware/db");
const { handleError } = require("../../middleware/utils");

/**
 * Get all users with pagination and filters
 */
const getAllUsers = async (req, res) => {
    try {
        const query = await checkQueryString(req.query);
        const { status, search } = req.query;

        if (status) query.status = status;
        if (search) query.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }, { phone: { $regex: search, $options: "i" } }];
        const users = await getItems(req, User, query)

        res.status(200).json({ success: true, result: users, message: "Users fetched successfully" });
    } catch (error) {
        handleError(res, error);
    }
};


module.exports = {
    getAllUsers
};