import React from 'react';
import { Link } from 'react-router-dom';

export const LogoMark = ({ className = 'h-9 w-9' }) => (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <rect width="64" height="64" rx="16" fill="#312E81" />
        <path d="M32 13 10 24l22 11 22-11-22-11Z" fill="#F59E0B" />
        <path d="M18 29v10c0 4.4 6.3 8 14 8s14-3.6 14-8V29l-14 7-14-7Z" fill="#fff" />
        <path d="M52 25v12" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
        <circle cx="52" cy="40" r="3" fill="#F59E0B" />
    </svg>
);

const Logo = ({ light = false }) => (
    <Link to="/" className="flex items-center gap-2.5" aria-label="College-Events-hub home">
        <LogoMark />
        <span className={`font-display text-lg font-bold leading-none ${light ? 'text-white' : 'text-brand-950'}`}>
            College<span className="text-accent-500">-</span>Events<span className="text-accent-500">-</span>hub
        </span>
    </Link>
);

export default Logo;
