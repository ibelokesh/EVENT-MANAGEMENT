import { useState } from 'react';

const empty = { title: '', description: '', category: 'other', venue: '', date: '', capacity: 50, price: 0 };

export default function EventForm({ onSubmit }) {
  const [form, setForm] = useState(empty);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    await onSubmit({
      ...form,
      date: new Date(form.date).toISOString(),
      capacity: Number(form.capacity),
      price: Number(form.price),
    });
    setForm(empty);
  };

  return (
    <form className="card form" onSubmit={submit}>
      <h3>Create event</h3>
      <input placeholder="Event title" value={form.title} onChange={set('title')} required />
      <textarea placeholder="Description" value={form.description} onChange={set('description')} />
      <div className="row">
        <select value={form.category} onChange={set('category')}>
          <option value="conference">Conference</option>
          <option value="workshop">Workshop</option>
          <option value="concert">Concert</option>
          <option value="sports">Sports</option>
          <option value="meetup">Meetup</option>
          <option value="other">Other</option>
        </select>
        <input placeholder="Venue" value={form.venue} onChange={set('venue')} required />
        <input type="datetime-local" value={form.date} onChange={set('date')} required />
      </div>
      <div className="row">
        <label>Capacity <input type="number" min="1" value={form.capacity} onChange={set('capacity')} required /></label>
        <label>Price (₹) <input type="number" min="0" value={form.price} onChange={set('price')} /></label>
      </div>
      <button className="btn">Add event</button>
    </form>
  );
}
