const router = require('express').Router();
const { getUsers, updateRole, deleteUser } = require('../controllers/userController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.use(protect);
router.get('/', authorizeRoles('admin', 'organizer'), getUsers);
router.patch('/:id/role', authorizeRoles('admin'), updateRole);
router.delete('/:id', authorizeRoles('admin'), deleteUser);

module.exports = router;
