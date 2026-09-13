import React from 'react';

const FilterChips = ({ options, value, onChange, allLabel = 'All' }) => (
    <div className="flex flex-wrap gap-2">
        {[{ label: allLabel, value: '' }, ...options.map((o) => ({ label: o, value: o }))].map((option) => {
            const active = value === option.value;
            return (
                <button
                    key={option.label}
                    type="button"
                    onClick={() => onChange(option.value)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${active
                        ? 'border-brand-700 bg-brand-700 text-white shadow'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700'
                        }`}
                >
                    {option.label}
                </button>
            );
        })}
    </div>
);

export default FilterChips;
