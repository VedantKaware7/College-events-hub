import React from 'react';
import { LogoMark } from '../components/Logo';

const AuthLayout = ({ title, subtitle, children }) => (
    <div className="container-page grid min-h-[calc(100vh-4rem)] items-center py-10 lg:grid-cols-2 lg:gap-16">
        <div className="relative hidden h-full max-h-[620px] overflow-hidden rounded-3xl bg-brand-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.3),transparent_45%),radial-gradient(circle_at_80%_90%,rgba(99,102,241,0.5),transparent_50%)]" />
            <LogoMark className="relative h-12 w-12" />
            <div className="relative">
                <h2 className="text-4xl font-extrabold leading-tight text-white">Fests. Workshops.<br />Hackathons.<br /><span className="text-accent-400">All on campus.</span></h2>
                <p className="mt-4 max-w-sm text-brand-200">Sign in with your college email to register for events and follow your approvals.</p>
            </div>
            <div className="relative flex gap-8 text-sm text-brand-200">
                <div><p className="font-display text-2xl font-bold text-white">6+</p>event categories</div>
                <div><p className="font-display text-2xl font-bold text-white">OTP</p>secured sign-ups</div>
            </div>
        </div>

        <div className="mx-auto w-full max-w-md">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">{title}</h1>
                {subtitle && <p className="mt-2 text-slate-500">{subtitle}</p>}
            </div>
            {children}
        </div>
    </div>
);

export default AuthLayout;
