import React from 'react';

const ClubSelect = ({ clubs, value, onChange, className = '' }) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={`input ${className}`} aria-label="Filter by club">
        <option value="">All clubs</option>
        {clubs.map((club) => (
            <option key={club} value={club}>{club}</option>
        ))}
    </select>
);

export default ClubSelect;
