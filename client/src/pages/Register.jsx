import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from './AuthLayout';
import OtpInput from '../components/OtpInput';
import { Alert } from '../components/Feedback';

const Register = () => {
    const { signUp, verifyAccount } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [otp, setOtp] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            if (codeSent) {
                await verifyAccount(form.email, otp);
                navigate('/dashboard', { replace: true });
            } else {
                await signUp(form.name, form.email, form.password);
                setCodeSent(true);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <AuthLayout
            title={codeSent ? 'Check your inbox' : 'Create your account'}
            subtitle={codeSent ? `Enter the code we sent to ${form.email}` : 'Join to register for college events'}
        >
            <form onSubmit={handleSubmit} className="card space-y-5 p-6 md:p-8">
                <Alert>{error}</Alert>

                {codeSent ? (
                    <OtpInput value={otp} onChange={setOtp} />
                ) : (
                    <>
                        <div>
                            <label className="label" htmlFor="name">Full name</label>
                            <input id="name" required className="input" placeholder="e.g. Sneha Deshmukh" value={form.name} onChange={update('name')} />
                        </div>
                        <div>
                            <label className="label" htmlFor="email">College email</label>
                            <input id="email" type="email" required autoComplete="email" className="input" placeholder="you@college.edu" value={form.email} onChange={update('email')} />
                        </div>
                        <div>
                            <label className="label" htmlFor="password">Password</label>
                            <input id="password" type="password" required minLength={6} autoComplete="new-password" className="input" placeholder="At least 6 characters" value={form.password} onChange={update('password')} />
                        </div>
                    </>
                )}

                <button type="submit" disabled={busy || (codeSent && otp.length !== 6)} className="btn-primary w-full py-3">
                    {busy ? 'Please wait…' : codeSent ? 'Verify & continue' : 'Create account'}
                </button>
            </form>

            {!codeSent && (
                <p className="mt-6 text-center text-sm text-slate-600">
                    Already registered? <Link to="/login" className="font-semibold text-brand-700 hover:underline">Sign in</Link>
                </p>
            )}
        </AuthLayout>
    );
};

export default Register;
