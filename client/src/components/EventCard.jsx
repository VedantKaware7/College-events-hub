import React from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiMapPin, FiUsers } from 'react-icons/fi';
import { CATEGORY_STYLES, formatDate, formatFee, formatTime, isPast } from '../utils/format';

const EventCard = ({ event }) => {
    const filled = event.capacity ? Math.round(((event.capacity - event.seatsLeft) / event.capacity) * 100) : 0;
    const past = isPast(event.date);
    const eventDate = new Date(event.date);

    return (
        <Link
            to={`/events/${event._id}`}
            className="card group flex flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-xl"
        >
            <div className="relative h-44 overflow-hidden bg-brand-100">
                {event.bannerUrl ? (
                    <img src={event.bannerUrl} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                    <div className="flex h-full items-center justify-center font-display text-3xl font-bold text-brand-300">{event.category}</div>
                )}
                <div className="absolute left-3 top-3 flex flex-col items-center rounded-xl bg-white px-3 py-1.5 text-center shadow">
                    <span className="text-[10px] font-bold uppercase text-accent-600">{eventDate.toLocaleString('en-IN', { month: 'short' })}</span>
                    <span className="font-display text-xl font-bold leading-none text-brand-950">{eventDate.getDate()}</span>
                </div>
                <span className="absolute right-3 top-3 rounded-full bg-brand-950/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                    {formatFee(event.entryFee)}
                </span>
                {past && <span className="absolute bottom-3 right-3 pill bg-slate-900/80 text-white">Completed</span>}
            </div>

            <div className="flex flex-1 flex-col p-5">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={`pill ${CATEGORY_STYLES[event.category] || 'bg-slate-100 text-slate-700'}`}>{event.category}</span>
                    <span className="text-xs font-medium text-slate-500">by {event.club}</span>
                </div>
                <h3 className="mb-3 line-clamp-2 text-lg font-semibold leading-snug group-hover:text-brand-700">{event.title}</h3>

                <div className="mb-4 space-y-1.5 text-sm text-slate-600">
                    <p className="flex items-center gap-2"><FiCalendar className="shrink-0 text-brand-500" /> {formatDate(event.date, { weekday: 'short' })} · {formatTime(event.date)}</p>
                    <p className="flex items-center gap-2"><FiMapPin className="shrink-0 text-brand-500" /> <span className="truncate">{event.venue}</span></p>
                </div>

                <div className="mt-auto">
                    <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1"><FiUsers /> {event.seatsLeft} seats left</span>
                        <span>{filled}% filled</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full ${filled >= 85 ? 'bg-rose-500' : 'bg-brand-600'}`} style={{ width: `${filled}%` }} />
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default EventCard;
