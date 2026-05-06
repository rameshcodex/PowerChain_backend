const express = require("express");
const router = express.Router();

// Middlewares
const { tokenValidator } = require("../middleware/auth/tokenValidator");
const { roleAuthorization } = require("../middleware/auth");

// Controllers
const { 
    getAllUsers, 
    getUserById, 
    updateUserStatus, 
    deleteUser
} = require("../controllers/admin");


const { 
    getAllOkxPairs,
    updateOkxPairStatus
} = require("../controllers/admin/okxPairs");

const { updateKYCStatus } = require("../controllers/auth/userOnboard");

/**
 * KYC Routes
 */
router.patch(
    "/kyc/:kycId/status",
    tokenValidator,
    roleAuthorization(['admin', 'superadmin', 'subadmin']),
    updateKYCStatus
);

/**
 * User Management Routes
 */
router.get(
    "/users",
    tokenValidator,
    roleAuthorization(['admin', 'superadmin']),
    getAllUsers
);

router.get(
    "/user-detail",
    tokenValidator,
    roleAuthorization(['admin', 'superadmin']),
    getUserById
);

router.post(
    "/user-update-status",
    tokenValidator,
    roleAuthorization(['admin', 'superadmin']),
    updateUserStatus
);

router.post(
    "/user-delete",
    tokenValidator,
    roleAuthorization(['admin', 'superadmin']),
    deleteUser
);

/**
 * OKX Pairs Management Routes
 */
router.get(
    "/okx-pairs",
    tokenValidator,
    roleAuthorization(['admin', 'superadmin']),
    getAllOkxPairs
);

router.post(
    "/okx-pairs-update-status",
    tokenValidator,
    roleAuthorization(['admin', 'superadmin']),
    updateOkxPairStatus
);


module.exports = router;

