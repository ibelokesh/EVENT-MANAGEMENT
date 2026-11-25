const router = require('express').Router();
const {
  getEvents, createEvent, updateEvent, deleteEvent,
  registerForEvent, cancelRegistration, getAttendees, getMyRegistrations,
} = require('../controllers/eventController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.use(protect);
router.get('/', getEvents);
router.get('/mine/registered', getMyRegistrations); // keep above "/:id" routes
router.post('/', authorizeRoles('admin', 'organizer'), createEvent);
router.put('/:id', authorizeRoles('admin', 'organizer'), updateEvent);
router.delete('/:id', authorizeRoles('admin', 'organizer'), deleteEvent);
router.post('/:id/register', registerForEvent);
router.delete('/:id/register', cancelRegistration);
router.get('/:id/attendees', authorizeRoles('admin', 'organizer'), getAttendees);

module.exports = router;
