const { getAllUsers } = require("./getAllUser");
const { getUserById } = require("./getUserById");
const { updateUserStatus } = require("./updateUserStatus");
const { deleteUser } = require("./deleteUser");
const { adminLogin } = require("./adminLogin");
const { adminRegister } = require("./adminRegister");
const { getAllOkxPairs, updateOkxPairStatus } = require("./okxPairs");

module.exports = {
    getAllUsers,
    getUserById,
    updateUserStatus,
    deleteUser,
    adminLogin,
    adminRegister,
    getAllOkxPairs,
    updateOkxPairStatus
};