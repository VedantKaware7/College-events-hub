import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiCheckCircle, FiClock, FiMapPin, FiXCircle } from 'react-icons/fi';
import { cancelRegistration, fetchMyRegistrations } from '../api/registrations';
import { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import { Alert, EmptyState, Spinner } from '../components/Feedback';
import { STATUS_STYLES, formatDate, formatFee, formatTime, isPast } from '../utils/format';

const StudentDashboard = () => {
    const { user } = useAuth();
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = () =>
        fetchMyRegistrations()
            .then(setRegistrations)
            .catch((err) => setError(errorMessage(err, 'Could not load registrations')))
            .finally(() => setLoading(false));

    useEffect(() => { load(); }, []);

    const counts = useMemo(() => ({
        approved: registrations.filter((r) => r.status === 'approved').length,
        pending: registrations.filter((r) => r.status === 'pending').length,
        upcoming: registrations.filter((r) => r.event && r.status !== 'cancelled' && !isPast(r.event.date)).length
    }), [registrations]);

    const handleCancel = async (id) => {
        if (!window.confirm('Cancel this registration?')) return;
        try {
            await cancelRegistration(id);
            load();
        } catch (err) {
            setError(errorMessage(err));
        }
    };

    if (loading) return <Spinner label="Loading your registrations…" />;

    return (
        <div className="container-page py-10">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-700 font-display text-2xl font-bold text-white">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Hi, {user.name.split(' ')[0]} 👋</h1>
                        <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                </div>
                <Link to="/" className="btn-primary">Find more events</Link>
            </div>

            <div className="mb-10 grid gap-4 sm:grid-cols-3">
                <StatCard icon={FiCalendar} label="Upcoming for you" value={counts.upcoming} />
                <StatCard icon={FiCheckCircle} label="Approved" value={counts.approved} tone="green" />
                <StatCard icon={FiClock} label="Awaiting approval" value={counts.pending} tone="accent" />
            </div>

            <h2 className="mb-4 text-xl font-semibold">My registrations</h2>
            <Alert>{error}</Alert>

            {registrations.length === 0 ? (
                <EmptyState
                    icon={FiCalendar}
                    title="No registrations yet"
                    text="When you register for an event, it will show up here with its approval status."
                    action={<Link to="/" className="btn-primary">Browse events</Link>}
                />
            ) : (
                <div className="space-y-4">
                    {registrations.map((reg) => {
                        const event = reg.event;
                        if (!event) return null;
                        const canCancel = reg.status !== 'cancelled' && !isPast(event.date);
                        return (
                            <div key={reg._id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                                <img src={event.bannerUrl || '/logo.svg'} alt="" className="h-24 w-full rounded-xl object-cover sm:w-36" />
                                <div className="flex-1">
                                    <div className="mb-1 flex flex-wrap items-center gap-2">
                                        <span className={`pill capitalize ${STATUS_STYLES[reg.status]}`}>{reg.status}</span>
                                        <span className="text-xs text-slate-500">{event.club}</span>
                                    </div>
                                    <Link to={`/events/${event._id}`} className="font-display text-lg font-semibold hover:text-brand-700">{event.title}</Link>
                                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                                        <span className="flex items-center gap-1"><FiCalendar /> {formatDate(event.date)} · {formatTime(event.date)}</span>
                                        <span className="flex items-center gap-1"><FiMapPin /> {event.venue}</span>
                                        <span>{formatFee(reg.entryFee)}{reg.entryFee > 0 && ` (${reg.feeStatus})`}</span>
                                    </div>
                                </div>
                                {canCancel && (
                                    <button onClick={() => handleCancel(reg._id)} className="btn-danger self-start sm:self-center">
                                        <FiXCircle /> Cancel
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;
