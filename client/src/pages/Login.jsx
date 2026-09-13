import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from './AuthLayout';
import OtpInput from '../components/OtpInput';
import { Alert } from '../components/Feedback';

const Login = () => {
    const { signIn, verifyAccount } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [form, setForm] = useState({ email: '', password: '' });
    const [otp, setOtp] = useState('');
    const [needsOtp, setNeedsOtp] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [busy, setBusy] = useState(false);

    const goHome = (session) => {
        const from = location.state?.from;
        navigate(from || (session.role === 'admin' ? '/admin' : '/dashboard'), { replace: true });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            const session = needsOtp ? await verifyAccount(form.email, otp) : await signIn(form.email, form.password);
            goHome(session);
        } catch (err) {
            if (err.needsVerification) {
                setNeedsOtp(true);
                setNotice('Your account is not verified yet. We emailed you a new code.');
            } else {
                setError(err.message);
            }
        } finally {
            setBusy(false);
        }
    };

    return (
        <AuthLayout title={needsOtp ? 'Verify your account' : 'Welcome back'} subtitle={needsOtp ? form.email : 'Sign in to College-Events-hub'}>
            <form onSubmit={handleSubmit} className="card space-y-5 p-6 md:p-8">
                <Alert>{error}</Alert>
                <Alert tone="info">{notice}</Alert>

                {needsOtp ? (
                    <OtpInput value={otp} onChange={setOtp} />
                ) : (
                    <>
                        <div>
                            <label className="label" htmlFor="email">College email</label>
                            <input id="email" type="email" required autoComplete="email" className="input" placeholder="you@college.edu"
                                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                        </div>
                        <div>
                            <label className="label" htmlFor="password">Password</label>
                            <input id="password" type="password" required autoComplete="current-password" className="input"
                                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                        </div>
                    </>
                )}

                <button type="submit" disabled={busy} className="btn-primary w-full py-3">
                    {busy ? 'Please wait…' : needsOtp ? 'Verify & sign in' : 'Sign in'}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
                New here? <Link to="/register" className="font-semibold text-brand-700 hover:underline">Create a student account</Link>
            </p>
        </AuthLayout>
    );
};

export default Login;
