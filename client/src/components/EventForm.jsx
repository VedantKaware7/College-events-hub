import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { Alert } from './Feedback';

const EMPTY = { title: '', description: '', date: '', venue: '', category: '', club: '', capacity: '', entryFee: 0, bannerUrl: '' };

// datetime-local needs "YYYY-MM-DDTHH:mm" in local time
const toLocalInput = (value) => {
    if (!value) return '';
    const d = new Date(value);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const EventForm = ({ initial, categories, clubs, onSubmit, onClose }) => {
    const [form, setForm] = useState(initial ? { ...EMPTY, ...initial, date: toLocalInput(initial.date) } : EMPTY);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            await onSubmit({
                ...form,
                date: new Date(form.date).toISOString(),
                capacity: Number(form.capacity),
                entryFee: Number(form.entryFee) || 0
            });
        } catch (err) {
            setError(err.message);
            setBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm md:items-center">
            <form onSubmit={handleSubmit} className="card w-full max-w-2xl p-6 md:p-8">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold">{initial ? 'Edit event' : 'Create a new event'}</h2>
                    <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close"><FiX size={20} /></button>
                </div>

                <Alert>{error}</Alert>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <label className="label">Event title</label>
                        <input className="input" required value={form.title} onChange={update('title')} />
                    </div>
                    <div>
                        <label className="label">Category</label>
                        <select className="input" required value={form.category} onChange={update('category')}>
                            <option value="" disabled>Select category</option>
                            {categories.map((c) => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Organising club / department</label>
                        <input className="input" required list="club-options" value={form.club} onChange={update('club')} placeholder="e.g. Coding Club" />
                        <datalist id="club-options">{clubs.map((c) => <option key={c} value={c} />)}</datalist>
                    </div>
                    <div>
                        <label className="label">Date & time</label>
                        <input type="datetime-local" className="input" required value={form.date} onChange={update('date')} />
                    </div>
                    <div>
                        <label className="label">Venue</label>
                        <input className="input" required value={form.venue} onChange={update('venue')} placeholder="e.g. Seminar Hall 2" />
                    </div>
                    <div>
                        <label className="label">Capacity</label>
                        <input type="number" min="1" className="input" required value={form.capacity} onChange={update('capacity')} />
                    </div>
                    <div>
                        <label className="label">Entry fee (₹, 0 for free)</label>
                        <input type="number" min="0" className="input" value={form.entryFee} onChange={update('entryFee')} />
                    </div>
                    <div className="md:col-span-2">
                        <label className="label">Banner image URL</label>
                        <input type="url" className="input" value={form.bannerUrl} onChange={update('bannerUrl')} placeholder="https://…" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="label">Description</label>
                        <textarea rows="4" className="input" required value={form.description} onChange={update('description')} />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
                    <button type="submit" disabled={busy} className="btn-primary">{busy ? 'Saving…' : initial ? 'Save changes' : 'Publish event'}</button>
                </div>
            </form>
        </div>
    );
};

export default EventForm;
