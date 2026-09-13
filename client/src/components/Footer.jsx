import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

const Footer = () => (
    <footer className="mt-20 bg-brand-950 text-brand-200">
        <div className="container-page grid gap-10 py-12 md:grid-cols-3">
            <div>
                <Logo light />
                <p className="mt-4 max-w-xs text-sm leading-relaxed text-brand-300">
                    One place for every fest, workshop, seminar and sports meet on campus.
                </p>
            </div>
            <div>
                <h4 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-white">Explore</h4>
                <ul className="space-y-2 text-sm">
                    <li><Link to="/?category=Technical" className="hover:text-white">Technical events</Link></li>
                    <li><Link to="/?category=Cultural" className="hover:text-white">Cultural fests</Link></li>
                    <li><Link to="/?category=Workshop" className="hover:text-white">Workshops</Link></li>
                    <li><Link to="/?category=Sports" className="hover:text-white">Sports</Link></li>
                </ul>
            </div>
            <div>
                <h4 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-white">For students</h4>
                <ul className="space-y-2 text-sm">
                    <li><Link to="/register" className="hover:text-white">Create an account</Link></li>
                    <li><Link to="/dashboard" className="hover:text-white">My registrations</Link></li>
                    <li><Link to="/login" className="hover:text-white">Sign in</Link></li>
                </ul>
            </div>
        </div>
        <div className="border-t border-white/10">
            <div className="container-page py-5 text-xs text-brand-300">
                © {new Date().getFullYear()} College-Events-hub
            </div>
        </div>
    </footer>
);

export default Footer;
