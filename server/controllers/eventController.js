const Event = require('../models/Event');
const Registration = require('../models/Registration');

const populate = (q) => q.populate('createdBy', 'name email');
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// admin can touch any event; organizer only their own
const canManage = (user, event) =>
  user.role === 'admin' || (user.role === 'organizer' && String(event.createdBy) === String(user._id));

// GET /api/events?category=&status=&search=
// every logged-in user can browse; each event carries isRegistered for the caller
exports.getEvents = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) filter.title = { $regex: escapeRegex(req.query.search), $options: 'i' };

    const [events, mine] = await Promise.all([
      populate(Event.find(filter).sort('date')).lean(),
      Registration.find({ user: req.user._id }).select('event').lean(),
    ]);
    const joined = new Set(mine.map((r) => String(r.event)));
    res.json(events.map((e) => ({ ...e, isRegistered: joined.has(String(e._id)) })));
  } catch (err) {
    next(err);
  }
};

// POST /api/events  (admin, organizer)
exports.createEvent = async (req, res, next) => {
  try {
    const { title, description, category, venue, date, capacity, price } = req.body;
    if (!title || !venue || !date || !capacity) {
      return res.status(400).json({ message: 'Title, venue, date and capacity are required' });
    }
    const event = await Event.create({
      title, description, category, venue, date, capacity, price,
      createdBy: req.user._id,
    });
    res.status(201).json(await populate(Event.findById(event._id)));
  } catch (err) {
    next(err);
  }
};

// PUT /api/events/:id  (admin, or the organizer who created it)
exports.updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (!canManage(req.user, event)) {
      return res.status(403).json({ message: 'You can only edit your own events' });
    }
    if (req.body.capacity !== undefined && Number(req.body.capacity) < event.registeredCount) {
      return res.status(400).json({ message: `Capacity cannot be below current registrations (${event.registeredCount})` });
    }
    ['title', 'description', 'category', 'venue', 'date', 'capacity', 'price', 'status'].forEach((f) => {
      if (req.body[f] !== undefined) event[f] = req.body[f];
    });
    await event.save();
    res.json(await populate(Event.findById(event._id)));
  } catch (err) {
    next(err);
  }
};

// DELETE /api/events/:id  (admin, or the organizer who created it)
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (!canManage(req.user, event)) {
      return res.status(403).json({ message: 'You can only delete your own events' });
    }
    await event.deleteOne();
    await Registration.deleteMany({ event: event._id });
    res.json({ message: 'Event deleted' });
  } catch (err) {
    next(err);
  }
};

// POST /api/events/:id/register  (any logged-in user)
// The seat is claimed with one atomic update, so two people can't take the last seat.
exports.registerForEvent = async (req, res, next) => {
  try {
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, status: 'upcoming', $expr: { $lt: ['$registeredCount', '$capacity'] } },
      { $inc: { registeredCount: 1 } },
      { new: true }
    );
    if (!event) {
      const exists = await Event.findById(req.params.id);
      if (!exists) return res.status(404).json({ message: 'Event not found' });
      if (exists.status !== 'upcoming') return res.status(400).json({ message: 'Registration is closed for this event' });
      return res.status(400).json({ message: 'Event is full' });
    }
    try {
      await Registration.create({ event: event._id, user: req.user._id });
    } catch (err) {
      await Event.updateOne({ _id: event._id }, { $inc: { registeredCount: -1 } }); // give the seat back
      if (err.code === 11000) return res.status(409).json({ message: 'You are already registered' });
      throw err;
    }
    res.status(201).json({ message: 'Registered', registeredCount: event.registeredCount });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/events/:id/register  (cancel own registration)
exports.cancelRegistration = async (req, res, next) => {
  try {
    const reg = await Registration.findOneAndDelete({ event: req.params.id, user: req.user._id });
    if (!reg) return res.status(404).json({ message: 'You are not registered for this event' });
    await Event.updateOne({ _id: req.params.id }, { $inc: { registeredCount: -1 } });
    res.json({ message: 'Registration cancelled' });
  } catch (err) {
    next(err);
  }
};

// GET /api/events/:id/attendees  (admin, or the organizer who created it)
exports.getAttendees = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (!canManage(req.user, event)) {
      return res.status(403).json({ message: 'You can only view attendees of your own events' });
    }
    const regs = await Registration.find({ event: event._id }).populate('user', 'name email').sort('createdAt');
    res.json(regs.filter((r) => r.user).map((r) => ({ _id: r._id, user: r.user, registeredAt: r.createdAt })));
  } catch (err) {
    next(err);
  }
};

// GET /api/events/mine/registered  (events the caller has registered for)
exports.getMyRegistrations = async (req, res, next) => {
  try {
    const regs = await Registration.find({ user: req.user._id }).populate({
      path: 'event',
      populate: { path: 'createdBy', select: 'name email' },
    });
    const events = regs
      .filter((r) => r.event)
      .map((r) => ({ ...r.event.toObject(), isRegistered: true }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    res.json(events);
  } catch (err) {
    next(err);
  }
};
