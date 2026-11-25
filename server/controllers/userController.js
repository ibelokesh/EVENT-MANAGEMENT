const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

const ROLES = ['admin', 'organizer', 'attendee'];

// GET /api/users  (admin, organizer)
exports.getUsers = async (req, res, next) => {
  try {
    res.json(await User.find().sort('name'));
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/:id/role  (admin)
exports.updateRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!ROLES.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    if (req.params.id === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot change your own role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/:id  (admin)
// Frees the seats the user held. Events they organised are kept (they stay owned by a deleted user).
exports.deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot delete yourself' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const regs = await Registration.find({ user: user._id });
    await Promise.all(regs.map((r) => Event.updateOne({ _id: r.event }, { $inc: { registeredCount: -1 } })));
    await Registration.deleteMany({ user: user._id });
    res.json({ message: 'User deleted' });
  } catch (err) {
    next(err);
  }
};
