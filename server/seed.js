// Creates demo users + sample events: npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Event = require('./models/Event');

const users = [
  { name: 'Admin', email: 'admin@eventhub.com', password: 'admin123', role: 'admin' },
  { name: 'Olivia Organizer', email: 'organizer@eventhub.com', password: 'organizer123', role: 'organizer' },
  { name: 'Aarav Attendee', email: 'attendee@eventhub.com', password: 'attendee123', role: 'attendee' },
];

const inDays = (d, hour = 10) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  dt.setHours(hour, 0, 0, 0);
  return dt;
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  for (const u of users) {
    if (await User.findOne({ email: u.email })) console.log(`${u.email} already exists`);
    else {
      await User.create(u);
      console.log(`Created ${u.role} -> ${u.email} / ${u.password} (change these!)`);
    }
  }

  if ((await Event.countDocuments()) === 0) {
    const organizer = await User.findOne({ email: 'organizer@eventhub.com' });
    await Event.insertMany([
      { title: 'DevConf 2026', description: 'Two-day developer conference.', category: 'conference', venue: 'Bengaluru Convention Centre', date: inDays(14), capacity: 200, price: 999, createdBy: organizer._id },
      { title: 'React Workshop', description: 'Hands-on React + Vite workshop.', category: 'workshop', venue: 'Tech Lab, Hyderabad', date: inDays(7, 14), capacity: 30, price: 0, createdBy: organizer._id },
      { title: 'Sunset Live Concert', description: 'Open-air music night.', category: 'concert', venue: 'Marine Drive, Mumbai', date: inDays(21, 18), capacity: 500, price: 499, createdBy: organizer._id },
      { title: 'Startup Meetup', description: 'Monthly founders meetup.', category: 'meetup', venue: 'Cowork Hub, Pune', date: inDays(3, 17), capacity: 3, price: 0, createdBy: organizer._id },
    ]);
    console.log('Sample events created');
  }
  process.exit(0);
})();
