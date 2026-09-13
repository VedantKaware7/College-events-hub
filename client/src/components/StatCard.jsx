import React from 'react';

const StatCard = ({ icon: Icon, label, value, tone = 'brand' }) => {
    const tones = {
        brand: 'bg-brand-50 text-brand-700',
        accent: 'bg-accent-50 text-accent-600',
        green: 'bg-emerald-50 text-emerald-700',
        rose: 'bg-rose-50 text-rose-700'
    };
    return (
        <div className="card flex items-center gap-4 p-5">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${tones[tone]}`}>
                <Icon />
            </div>
            <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="font-display text-2xl font-bold text-slate-900">{value}</p>
            </div>
        </div>
    );
};

export default StatCard;
