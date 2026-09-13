import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

const linkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-600 hover:text-brand-800'}`;

const Navbar = () => {
    const { user, isAdmin, signOut } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const handleSignOut = () => {
        signOut();
        setOpen(false);
        navigate('/login');
    };

    const links = (
        <>
            <NavLink to="/" end className={linkClass} onClick={() => setOpen(false)}>Events</NavLink>
            {user && (
                <NavLink to={isAdmin ? '/admin' : '/dashboard'} className={linkClass} onClick={() => setOpen(false)}>
                    {isAdmin ? 'Admin Panel' : 'My Registrations'}
                </NavLink>
            )}
        </>
    );

    return (
        <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur">
            <nav className="container-page flex h-16 items-center justify-between">
                <Logo />

                <div className="hidden items-center gap-1 md:flex">{links}</div>

                <div className="hidden items-center gap-3 md:flex">
                    {user ? (
                        <>
                            <div className="flex items-center gap-2">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">
                                    {user.name.charAt(0).toUpperCase()}
                                </span>
                                <span className="text-sm font-medium text-slate-700">{user.name.split(' ')[0]}</span>
                            </div>
                            <button onClick={handleSignOut} className="btn-ghost px-3" title="Sign out">
                                <FiLogOut />
                            </button>
                        </>
                    ) : (
                        <>
                            <NavLink to="/login" className="btn-ghost">Sign in</NavLink>
                            <NavLink to="/register" className="btn-primary">Join now</NavLink>
                        </>
                    )}
                </div>

                <button className="rounded-lg p-2 text-slate-700 md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
                    {open ? <FiX size={22} /> : <FiMenu size={22} />}
                </button>
            </nav>

            {open && (
                <div className="border-t border-slate-200 bg-white md:hidden">
                    <div className="container-page flex flex-col gap-1 py-3">
                        {links}
                        {user ? (
                            <button onClick={handleSignOut} className="btn-ghost mt-2">Sign out</button>
                        ) : (
                            <div className="mt-2 grid grid-cols-2 gap-2">
                                <NavLink to="/login" className="btn-ghost" onClick={() => setOpen(false)}>Sign in</NavLink>
                                <NavLink to="/register" className="btn-primary" onClick={() => setOpen(false)}>Join now</NavLink>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Navbar;
