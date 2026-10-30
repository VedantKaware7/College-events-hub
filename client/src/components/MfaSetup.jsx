import React, { useEffect, useState } from 'react';
import { FiShield } from 'react-icons/fi';
import apiClient, { errorMessage } from '../api/client';
import OtpInput from './OtpInput';
import { Alert } from './Feedback';

const MfaSetup = () => {
    const [enabled, setEnabled] = useState(null);
    const [setup, setSetup] = useState(null);
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        apiClient.get('/auth/me').then(({ data }) => setEnabled(Boolean(data.mfaEnabled))).catch(() => setEnabled(false));
    }, []);

    const start = async () => {
        setBusy(true);
        setError('');
        try {
            const { data } = await apiClient.post('/auth/mfa/setup');
            setSetup(data);
        } catch (err) {
            setError(errorMessage(err, 'Could not start setup'));
        } finally {
            setBusy(false);
        }
    };

    const confirm = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            await apiClient.post('/auth/mfa/enable', { code });
            setEnabled(true);
            setSetup(null);
        } catch (err) {
            setError(errorMessage(err, 'Invalid code'));
        } finally {
            setBusy(false);
        }
    };

    if (enabled === null) return null;

    return (
        <section className="card mt-10 p-6">
            <div className="flex items-center gap-3">
                <FiShield className="text-2xl text-brand-700" />
                <div>
                    <h2 className="text-lg font-bold">Two-factor authentication</h2>
                    <p className="text-sm text-slate-600">
                        {enabled ? 'On. Sign-in asks for a code from your authenticator app.' : 'Protect your account with Google or Microsoft Authenticator.'}
                    </p>
                </div>
            </div>

            <div className="mt-4 space-y-4">
                <Alert>{error}</Alert>
                {!enabled && !setup && (
                    <button onClick={start} disabled={busy} className="btn-primary">Enable two-factor authentication</button>
                )}
                {setup && (
                    <form onSubmit={confirm} className="space-y-4">
                        <p className="text-sm text-slate-600">Scan this QR code in your authenticator app, then enter the 6-digit code it shows.</p>
                        <img src={setup.qrCode} alt="Authenticator QR code" className="h-48 w-48 rounded-lg border" />
                        <p className="break-all text-xs text-slate-500">Can't scan? Key: <code>{setup.secret}</code></p>
                        <OtpInput value={code} onChange={setCode} label="Authenticator code" />
                        <button type="submit" disabled={busy} className="btn-primary">Verify &amp; enable</button>
                    </form>
                )}
            </div>
        </section>
    );
};

export default MfaSetup;
