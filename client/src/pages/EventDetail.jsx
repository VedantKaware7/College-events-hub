import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiClock, FiMapPin, FiUsers, FiCreditCard, FiCheckCircle } from 'react-icons/fi';
import { fetchEvent } from '../api/events';
import { registerForEvent, requestRegistrationOtp } from '../api/registrations';
import { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import OtpInput from '../components/OtpInput';
import { Alert, Spinner } from '../components/Feedback';
import { CATEGORY_STYLES, formatDate, formatFee, formatTime, isPast } from '../utils/format';

const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAdmin } = useAuth();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState('idle'); // idle -> otp -> done
    const [otp, setOtp] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchEvent(id)
            .then(setEvent)
            .catch((err) => setError(errorMessage(err, 'Event not found')))
            .finally(() => setLoading(false));
    }, [id]);

    const startRegistration = async () => {
        if (!user) return navigate('/login', { state: { from: `/events/${id}` } });
        setBusy(true);
        setError('');
        try {
            await requestRegistrationOtp();
            setStep('otp');
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const confirmRegistration = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            await registerForEvent(event._id, otp);
            setStep('done');
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    if (loading) return <Spinner label="Loading event…" />;
    if (!event) {
        return (
            <div className="container-page py-20 text-center">
                <h1 className="text-2xl font-bold">Event not found</h1>
                <Link to="/" className="btn-primary mt-6">Back to events</Link>
            </div>
        );
    }

    const past = isPast(event.date);
    const full = event.seatsLeft <= 0;
    const filled = Math.round(((event.capacity - event.seatsLeft) / event.capacity) * 100);

    return (
        <div>
            <div className="relative h-72 bg-brand-950 md:h-96">
                {event.bannerUrl && <img src={event.bannerUrl} alt="" className="h-full w-full object-cover opacity-60" />}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/40 to-transparent" />
                <div className="container-page absolute inset-x-0 bottom-0 pb-8">
                    <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm text-brand-200 hover:text-white"><FiArrowLeft /> All events</Link>
                    <div className="mb-3 flex flex-wrap gap-2">
                        <span className={`pill ${CATEGORY_STYLES[event.category] || 'bg-slate-100'}`}>{event.category}</span>
                        <span className="pill bg-white/15 text-white">{event.club}</span>
                        {past && <span className="pill bg-slate-900 text-white">Completed</span>}
                    </div>
                    <h1 className="max-w-3xl text-3xl font-extrabold text-white md:text-5xl">{event.title}</h1>
                </div>
            </div>

            <div className="container-page grid gap-8 py-10 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <div className="card p-6 md:p-8">
                        <h2 className="mb-3 text-xl font-semibold">About this event</h2>
                        <p className="whitespace-pre-line leading-relaxed text-slate-600">{event.description}</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {[
                            { icon: FiCalendar, label: 'Date', value: formatDate(event.date, { weekday: 'long' }) },
                            { icon: FiClock, label: 'Time', value: formatTime(event.date) },
                            { icon: FiMapPin, label: 'Venue', value: event.venue },
                            { icon: FiUsers, label: 'Organised by', value: event.club }
                        ].map(({ icon: Icon, label, value }) => (
                            <div key={label} className="card flex items-center gap-4 p-5">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Icon /></div>
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
                                    <p className="font-semibold text-slate-800">{value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <aside className="lg:sticky lg:top-24 lg:self-start">
                    <div className="card p-6">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">Entry fee</span>
                            <span className="font-display text-2xl font-bold text-brand-900">{formatFee(event.entryFee)}</span>
                        </div>

                        <div className="mt-5">
                            <div className="mb-1.5 flex justify-between text-sm">
                                <span className="text-slate-500">Seats</span>
                                <span className="font-medium">{event.seatsLeft} / {event.capacity} left</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                <div className={`h-full rounded-full ${filled >= 85 ? 'bg-rose-500' : 'bg-brand-600'}`} style={{ width: `${filled}%` }} />
                            </div>
                        </div>

                        <div className="mt-6 space-y-4">
                            <Alert>{error}</Alert>

                            {step === 'done' ? (
                                <div className="rounded-xl bg-emerald-50 p-5 text-center">
                                    <FiCheckCircle className="mx-auto mb-2 text-3xl text-emerald-600" />
                                    <p className="font-semibold text-emerald-800">Registration submitted!</p>
                                    <p className="mt-1 text-sm text-emerald-700">The organisers will review and approve it. You'll get an email.</p>
                                    <Link to="/dashboard" className="btn-primary mt-4 w-full">View my registrations</Link>
                                </div>
                            ) : step === 'otp' ? (
                                <form onSubmit={confirmRegistration} className="space-y-4">
                                    <Alert tone="info">We sent a 6-digit code to <strong>{user.email}</strong>.</Alert>
                                    <OtpInput value={otp} onChange={setOtp} />
                                    <button className="btn-primary w-full py-3" disabled={busy || otp.length !== 6}>
                                        {busy ? 'Confirming…' : 'Confirm registration'}
                                    </button>
                                    <button type="button" onClick={startRegistration} disabled={busy} className="w-full text-sm font-medium text-brand-700 hover:underline">
                                        Resend code
                                    </button>
                                </form>
                            ) : (
                                <button
                                    onClick={startRegistration}
                                    disabled={busy || past || full || isAdmin}
                                    className="btn-accent w-full py-3 text-base"
                                >
                                    {busy ? 'Sending code…' : past ? 'Event has ended' : full ? 'Event is full' : isAdmin ? 'Admins cannot register' : user ? 'Register now' : 'Sign in to register'}
                                </button>
                            )}

                            {event.entryFee > 0 && step !== 'done' && (
                                <p className="flex items-start gap-2 text-xs text-slate-500">
                                    <FiCreditCard className="mt-0.5 shrink-0" /> The fee is collected at the event desk. Your seat is confirmed once an admin approves the registration.
                                </p>
                            )}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default EventDetail;
