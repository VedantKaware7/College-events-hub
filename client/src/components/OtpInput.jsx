import React from 'react';

const OtpInput = ({ value, onChange, label = 'Verification code' }) => (
    <div>
        <label className="label" htmlFor="otp">{label}</label>
        <input
            id="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="••••••"
            maxLength={6}
            required
            value={value}
            onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
            className="input text-center font-display text-2xl font-semibold tracking-[0.6em]"
        />
    </div>
);

export default OtpInput;
