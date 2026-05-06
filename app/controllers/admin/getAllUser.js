const User = require("../../models/user");
const { getItems, checkBodyString } = require("../../middleware/db");
const { handleError } = require("../../middleware/utils");

/**
 * Get all users with pagination and filters
 */
const getAllUsers = async (req, res) => {
    try {
        const body = req.body || {};
        const data = await checkBodyString(body);
        const status = body.status || "";

        if (status) {
            data.status = status;
        }

        res.status(200).json(await getItems(req, User, data));
    } catch (error) {
        handleError(res, error);
    }
};



module.exports = {
    getAllUsers
};