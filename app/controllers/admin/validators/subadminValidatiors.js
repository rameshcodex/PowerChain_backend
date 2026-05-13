const { check } = require('express-validator');
const { handleValidation } = require('../../../middleware/utils/handleValidation');

const createRoleValidation = [
  check('role_name').trim().notEmpty().withMessage('Role name is required'),
  check('permissions').isArray({ min: 1 }).withMessage('At least one permission is required'),
  (req, res, next) => {
    handleValidation(req, res, next)
  },
];

const updateRoleValidation = [
  check('role_name').trim().notEmpty().withMessage('Role name is required').optional(),
  check('permissions').isArray({ min: 1 }).withMessage('At least one permission is required').optional(),
  check('status').isIn(['active', 'inactive']).withMessage('Invalid status').optional(),
  (req, res, next) => {
    handleValidation(req, res, next)
  },
];

const createStaffValidation = [
  check('name').trim().notEmpty().withMessage('Name is required'),
  check('username').trim().notEmpty().withMessage('Username is required'),
  check('email').isEmail().withMessage('Valid email is required'),
  check('phone').optional(),
  check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  check('role').optional(),
  check('roleType').trim().notEmpty().withMessage('Role Type is required'),
  (req, res, next) => {
    handleValidation(req, res, next)
  },
];

const updateStaffValidation = [
  check('name').trim().notEmpty().withMessage('Name is required').optional(),
  check('username').trim().notEmpty().withMessage('Username is required').optional(),
  check('email').isEmail().withMessage('Valid email is required').optional(),
  check('phone').optional(),
  check('role').optional(),
  check('roleType').trim().notEmpty().withMessage('Role Type is required').optional(),
  check('staffId').trim().notEmpty().withMessage('Staff ID is required'),
  check('status').isIn(['active', 'inactive']).withMessage('Invalid status').optional(),
  (req, res, next) => {
    handleValidation(req, res, next)
  },
];

const updateStaffStatusValidation = [
  check('staffId').trim().notEmpty().withMessage('Staff ID is required'),
  check('status').isIn(['active', 'inactive']).withMessage('Invalid status'),
  (req, res, next) => {
    handleValidation(req, res, next)
  },
];

module.exports = {
  createRoleValidation,
  updateRoleValidation,
  createStaffValidation,
  updateStaffValidation,
  updateStaffStatusValidation,
};