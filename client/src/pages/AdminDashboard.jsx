import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiCheck, FiClock, FiEdit2, FiPlus, FiTrash2, FiTrendingUp, FiUsers, FiX } from 'react-icons/fi';
import { createEvent, deleteEvent, fetchEventFilters, fetchEvents, updateEvent } from '../api/events';
import { approveRegistration, cancelRegistration, fetchAdminStats, fetchAllRegistrations } from '../api/registrations';
import { errorMessage } from '../api/client';
import StatCard from '../components/StatCard';
import EventForm from '../components/EventForm';
import { Alert, EmptyState, Spinner } from '../components/Feedback';
import { CATEGORY_STYLES, STATUS_STYLES, formatDate, formatFee, isPast } from '../utils/format';

const TABS = ['Overview', 'Events', 'Registrations'];

const AdminDashboard = () => {
    const [tab, setTab] = useState('Overview');
    const [stats, setStats] = useState(null);
    const [events, setEvents] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [filters, setFilters] = useState({ categories: [], clubs: [] });
    const [statusFilter, setStatusFilter] = useState('pending');
    const [editing, setEditing] = useState(null); // null | 'new' | event
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadAll = useCallback(async () => {
        try {
            const [statsData, eventsData, regsData, filterData] = await Promise.all([
                fetchAdminStats(),
                fetchEvents(),
                fetchAllRegistrations(),
                fetchEventFilters()
            ]);
            setStats(statsData);
            setEvents(eventsData);
            setRegistrations(regsData);
            setFilters(filterData);
            setError('');
        } catch (err) {
            setError(errorMessage(err, 'Could not load admin data'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadAll(); }, [loadAll]);

    const visibleRegistrations = useMemo(
        () => (statusFilter ? registrations.filter((r) => r.status === statusFilter) : registrations),
        [registrations, statusFilter]
    );

    const runAction = async (action) => {
        try {
            await action();
            await loadAll();
        } catch (err) {
            setError(errorMessage(err));
        }
    };

    const saveEvent = async (payload) => {
        try {
            if (editing === 'new') await createEvent(payload);
            else await updateEvent(editing._id, payload);
        } catch (err) {
            throw new Error(errorMessage(err, 'Could not save event'));
        }
        setEditing(null);
        loadAll();
    };

    const removeEvent = (event) => {
        if (window.confirm(`Delete "${event.title}"? Its registrations will be removed too.`)) {
            runAction(() => deleteEvent(event._id));
        }
    };

    if (loading) return <Spinner label="Loading admin panel…" />;

    const maxCategory = Math.max(1, ...(stats?.eventsByCategory || []).map((c) => c.count));

    return (
        <div className="container-page py-10">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-accent-600">Admin panel</p>
                    <h1 className="text-3xl font-bold">Manage college events</h1>
                </div>
                <button onClick={() => setEditing('new')} className="btn-primary"><FiPlus /> New event</button>
            </div>

            <div className="mb-8 flex gap-1 border-b border-slate-200">
                {TABS.map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition ${tab === t ? 'border-brand-700 text-brand-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        {t}
                        {t === 'Registrations' && stats?.pending > 0 && <span className="ml-2 rounded-full bg-accent-500 px-2 py-0.5 text-xs text-brand-950">{stats.pending}</span>}
                    </button>
                ))}
            </div>

            <div className="mb-4"><Alert>{error}</Alert></div>

            {tab === 'Overview' && stats && (
                <div className="space-y-8">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard icon={FiCalendar} label="Upcoming events" value={`${stats.upcomingEvents} / ${stats.totalEvents}`} />
                        <StatCard icon={FiClock} label="Pending approvals" value={stats.pending} tone="accent" />
                        <StatCard icon={FiUsers} label="Approved registrations" value={stats.approved} tone="green" />
                        <StatCard icon={FiTrendingUp} label="Fees collected" value={formatFee(stats.feesCollected)} tone="rose" />
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="card p-6">
                            <h3 className="mb-5 font-semibold">Events by category</h3>
                            <div className="space-y-3">
                                {stats.eventsByCategory.map((c) => (
                                    <div key={c.category} className="flex items-center gap-3 text-sm">
                                        <span className="w-24 shrink-0 text-slate-600">{c.category}</span>
                                        <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                                            <div className="h-full rounded-full bg-brand-600" style={{ width: `${(c.count / maxCategory) * 100}%` }} />
                                        </div>
                                        <span className="w-6 text-right font-semibold">{c.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="font-semibold">Latest pending requests</h3>
                                <button onClick={() => setTab('Registrations')} className="text-sm font-medium text-brand-700 hover:underline">View all</button>
                            </div>
                            {registrations.filter((r) => r.status === 'pending').slice(0, 5).map((r) => (
                                <div key={r._id} className="flex items-center justify-between border-t border-slate-100 py-3 text-sm">
                                    <div>
                                        <p className="font-medium">{r.student?.name}</p>
                                        <p className="text-slate-500">{r.event?.title}</p>
                                    </div>
                                    <button onClick={() => runAction(() => approveRegistration(r._id, 'paid'))} className="btn-ghost px-3 py-1.5 text-emerald-700"><FiCheck /> Approve</button>
                                </div>
                            ))}
                            {stats.pending === 0 && <p className="text-sm text-slate-500">All caught up 🎉</p>}
                        </div>
                    </div>
                </div>
            )}

            {tab === 'Events' && (
                events.length === 0 ? (
                    <EmptyState icon={FiCalendar} title="No events yet" action={<button onClick={() => setEditing('new')} className="btn-primary">Create the first event</button>} />
                ) : (
                    <div className="card overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-5 py-3">Event</th>
                                    <th className="px-5 py-3">Club</th>
                                    <th className="px-5 py-3">Date</th>
                                    <th className="px-5 py-3">Seats</th>
                                    <th className="px-5 py-3">Fee</th>
                                    <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {events.map((event) => (
                                    <tr key={event._id} className="hover:bg-slate-50/60">
                                        <td className="px-5 py-4">
                                            <Link to={`/events/${event._id}`} className="font-semibold text-slate-900 hover:text-brand-700">{event.title}</Link>
                                            <div className="mt-1 flex gap-2">
                                                <span className={`pill ${CATEGORY_STYLES[event.category]}`}>{event.category}</span>
                                                {isPast(event.date) && <span className="pill bg-slate-200 text-slate-600">Completed</span>}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-slate-600">{event.club}</td>
                                        <td className="px-5 py-4 text-slate-600">{formatDate(event.date)}</td>
                                        <td className="px-5 py-4 text-slate-600">{event.capacity - event.seatsLeft} / {event.capacity}</td>
                                        <td className="px-5 py-4 text-slate-600">{formatFee(event.entryFee)}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setEditing(event)} className="btn-ghost px-3 py-1.5" title="Edit"><FiEdit2 /></button>
                                                <button onClick={() => removeEvent(event)} className="btn-danger px-3 py-1.5" title="Delete"><FiTrash2 /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            )}

            {tab === 'Registrations' && (
                <>
                    <div className="mb-4 flex flex-wrap gap-2">
                        {['pending', 'approved', 'cancelled', ''].map((s) => (
                            <button
                                key={s || 'all'}
                                onClick={() => setStatusFilter(s)}
                                className={`rounded-full border px-4 py-1.5 text-sm font-medium capitalize ${statusFilter === s ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-200 bg-white text-slate-600'}`}
                            >
                                {s || 'all'} ({s ? registrations.filter((r) => r.status === s).length : registrations.length})
                            </button>
                        ))}
                    </div>

                    {visibleRegistrations.length === 0 ? (
                        <EmptyState icon={FiUsers} title="Nothing here" text="No registrations with this status." />
                    ) : (
                        <div className="card overflow-x-auto">
                            <table className="w-full min-w-[820px] text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-5 py-3">Student</th>
                                        <th className="px-5 py-3">Event</th>
                                        <th className="px-5 py-3">Fee</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {visibleRegistrations.map((r) => (
                                        <tr key={r._id}>
                                            <td className="px-5 py-4">
                                                <p className="font-medium text-slate-900">{r.student?.name || 'Deleted user'}</p>
                                                <p className="text-xs text-slate-500">{r.student?.email}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="font-medium text-slate-800">{r.event?.title || 'Deleted event'}</p>
                                                <p className="text-xs text-slate-500">{r.event?.club} · {r.event && formatDate(r.event.date)}</p>
                                            </td>
                                            <td className="px-5 py-4 text-slate-600">
                                                {formatFee(r.entryFee)}
                                                {r.entryFee > 0 && <span className={`ml-2 pill ${r.feeStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'}`}>{r.feeStatus}</span>}
                                            </td>
                                            <td className="px-5 py-4"><span className={`pill capitalize ${STATUS_STYLES[r.status]}`}>{r.status}</span></td>
                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    {r.status === 'pending' && (
                                                        r.entryFee > 0 ? (
                                                            <>
                                                                <button onClick={() => runAction(() => approveRegistration(r._id, 'paid'))} className="btn-ghost px-3 py-1.5 text-emerald-700"><FiCheck /> Paid</button>
                                                                <button onClick={() => runAction(() => approveRegistration(r._id, 'unpaid'))} className="btn-ghost px-3 py-1.5 text-amber-700"><FiCheck /> Unpaid</button>
                                                            </>
                                                        ) : (
                                                            <button onClick={() => runAction(() => approveRegistration(r._id, 'paid'))} className="btn-ghost px-3 py-1.5 text-emerald-700"><FiCheck /> Approve</button>
                                                        )
                                                    )}
                                                    {r.status !== 'cancelled' && (
                                                        <button onClick={() => window.confirm('Cancel this registration?') && runAction(() => cancelRegistration(r._id))} className="btn-danger px-3 py-1.5"><FiX /> {r.status === 'pending' ? 'Reject' : 'Cancel'}</button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {editing && (
                <EventForm
                    initial={editing === 'new' ? null : editing}
                    categories={filters.categories}
                    clubs={filters.clubs}
                    onSubmit={saveEvent}
                    onClose={() => setEditing(null)}
                />
            )}
        </div>
    );
};

export default AdminDashboard;
