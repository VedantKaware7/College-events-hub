import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => (
    <div className="container-page flex flex-col items-center py-28 text-center">
        <p className="font-display text-7xl font-extrabold text-brand-200">404</p>
        <h1 className="mt-4 text-2xl font-bold">This page skipped class</h1>
        <p className="mt-2 text-slate-500">The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn-primary mt-8">Browse events</Link>
    </div>
);

export default NotFound;
