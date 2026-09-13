import React from 'react';

export const Spinner = ({ label = 'Loading…' }) => (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-500">
        <span className="h-9 w-9 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
        <span className="text-sm">{label}</span>
    </div>
);

export const Alert = ({ tone = 'error', children }) => {
    if (!children) return null;
    const styles = {
        error: 'border-rose-200 bg-rose-50 text-rose-700',
        success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        info: 'border-brand-200 bg-brand-50 text-brand-800'
    };
    return <div className={`rounded-xl border px-4 py-3 text-sm ${styles[tone]}`}>{children}</div>;
};

export const EmptyState = ({ icon: Icon, title, text, action }) => (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
        {Icon && (
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-2xl text-brand-600">
                <Icon />
            </div>
        )}
        <h3 className="text-lg font-semibold">{title}</h3>
        {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
        {action && <div className="mt-6">{action}</div>}
    </div>
);
