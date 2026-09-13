import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiSearch, FiCalendar, FiUsers, FiAward } from 'react-icons/fi';
import { fetchEventFilters, fetchEvents } from '../api/events';
import { errorMessage } from '../api/client';
import EventCard from '../components/EventCard';
import FilterChips from '../components/FilterChips';
import ClubSelect from '../components/ClubSelect';
import { Alert, EmptyState, Spinner } from '../components/Feedback';

const TABS = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'past', label: 'Past events' },
    { value: '', label: 'All' }
];

const Home = () => {
    const [params, setParams] = useSearchParams();
    const category = params.get('category') || '';
    const club = params.get('club') || '';
    const when = params.get('when') ?? 'upcoming';

    const [search, setSearch] = useState(params.get('search') || '');
    const [filters, setFilters] = useState({ categories: [], clubs: [] });
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [slow, setSlow] = useState(false);

    const updateParam = (key, value) => {
        const next = new URLSearchParams(params);
        if (value) next.set(key, value);
        else next.delete(key);
        setParams(next, { replace: true });
    };

    useEffect(() => {
        fetchEventFilters().then(setFilters).catch(() => {});
    }, []);

    useEffect(() => {
        let slowTimer;
        const timer = setTimeout(() => {
            setLoading(true);
            // Free-tier hosting sleeps when idle; tell the visitor instead of showing a silent spinner
            slowTimer = setTimeout(() => setSlow(true), 5000);
            fetchEvents({ category, club, when, search: search.trim() || undefined })
                .then((data) => { setEvents(data); setError(''); })
                .catch((err) => setError(errorMessage(err, 'Could not load events')))
                .finally(() => {
                    clearTimeout(slowTimer);
                    setSlow(false);
                    setLoading(false);
                });
        }, 300);
        return () => {
            clearTimeout(timer);
            clearTimeout(slowTimer);
        };
    }, [category, club, when, search]);

    const clearFilters = () => {
        setSearch('');
        setParams({}, { replace: true });
    };

    return (
        <>
            {/* Hero */}
            <section className="relative overflow-hidden bg-brand-950">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.25),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.45),transparent_60%)]" />
                <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border-[40px] border-white/5" />
                <div className="container-page relative grid items-center gap-10 py-16 md:py-24 lg:grid-cols-5">
                    <div className="lg:col-span-3">
                        <span className="pill mb-5 bg-accent-500/15 px-3 py-1 text-accent-300 ring-1 ring-accent-500/30">🎓 Your campus, all in one place</span>
                        <h1 className="text-4xl font-extrabold leading-tight text-white md:text-6xl">
                            Never miss a <span className="text-accent-400">college event</span> again.
                        </h1>
                        <p className="mt-5 max-w-xl text-lg text-brand-200">
                            Hackathons, cultural nights, workshops and sports meets from every club and department. Find one, register in seconds.
                        </p>

                        <div className="relative mt-8 max-w-xl">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400" />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search events, e.g. hackathon, dance, cloud…"
                                className="w-full rounded-2xl border-0 bg-white py-4 pl-12 pr-4 text-slate-900 shadow-xl placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-accent-400/50"
                            />
                        </div>
                    </div>

                    <div className="hidden gap-4 lg:col-span-2 lg:grid">
                        {[
                            { icon: FiCalendar, title: 'Every event, one calendar', text: 'Clubs and departments publish here first.' },
                            { icon: FiUsers, title: 'Register with OTP', text: 'Secure sign-up tied to your college email.' },
                            { icon: FiAward, title: 'Track approvals', text: 'See the status of every registration.' }
                        ].map(({ icon: Icon, title, text }) => (
                            <div key={title} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-500 text-brand-950"><Icon /></div>
                                <div>
                                    <p className="font-semibold text-white">{title}</p>
                                    <p className="text-sm text-brand-200">{text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Filters + list */}
            <section className="container-page -mt-6 relative">
                <div className="card p-4 md:p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <FilterChips options={filters.categories} value={category} onChange={(v) => updateParam('category', v)} allLabel="All categories" />
                        <ClubSelect clubs={filters.clubs} value={club} onChange={(v) => updateParam('club', v)} className="lg:w-60" />
                    </div>
                </div>

                <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold md:text-3xl">
                            {category || 'All'} events{club && <span className="text-brand-600"> · {club}</span>}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">{loading ? 'Loading…' : `${events.length} event${events.length === 1 ? '' : 's'} found`}</p>
                    </div>
                    <div className="inline-flex rounded-xl bg-slate-200/70 p-1">
                        {TABS.map((tab) => (
                            <button
                                key={tab.label}
                                onClick={() => updateParam('when', tab.value || 'all')}
                                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${(when === 'all' ? '' : when) === tab.value ? 'bg-white text-brand-800 shadow' : 'text-slate-600'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-6">
                    <Alert>{error}</Alert>
                    {loading ? (
                        <Spinner label={slow ? 'Waking up the server… this can take up to a minute on the first visit.' : 'Fetching events…'} />
                    ) : events.length === 0 ? (
                        <EmptyState
                            icon={FiCalendar}
                            title="No events match your filters"
                            text="Try a different category or club, or check past events."
                            action={<button onClick={clearFilters} className="btn-ghost">Clear filters</button>}
                        />
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {events.map((event) => <EventCard key={event._id} event={event} />)}
                        </div>
                    )}
                </div>
            </section>
        </>
    );
};

export default Home;
