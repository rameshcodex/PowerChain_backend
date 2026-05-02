const isAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin only.',
        });
    }
};
const isSubAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'subadmin')) {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin only.',
        });
    }
};

module.exports = { isAdmin, isSubAdmin };
