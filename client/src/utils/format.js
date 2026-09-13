export const formatDate = (value, options = {}) =>
    new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', ...options });

export const formatTime = (value) =>
    new Date(value).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

export const formatFee = (fee) => (Number(fee) === 0 ? 'Free' : `₹${Number(fee).toLocaleString('en-IN')}`);

export const isPast = (value) => new Date(value) < new Date();

export const CATEGORY_STYLES = {
    Technical: 'bg-sky-100 text-sky-800',
    Cultural: 'bg-pink-100 text-pink-800',
    Sports: 'bg-emerald-100 text-emerald-800',
    Workshop: 'bg-violet-100 text-violet-800',
    Seminar: 'bg-amber-100 text-amber-800',
    Hackathon: 'bg-indigo-100 text-indigo-800'
};

export const STATUS_STYLES = {
    pending: 'bg-amber-100 text-amber-800',
    approved: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-slate-200 text-slate-600'
};
