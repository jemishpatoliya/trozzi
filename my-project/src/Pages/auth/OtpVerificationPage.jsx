import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useContentSettings } from '../../context/ContentSettingsContext';

const OtpVerificationPage = () => {
    const { settings } = useContentSettings();
    const { verifyOtp } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const initial = useMemo(() => {
        const state = location?.state || {};
        return {
            phone: String(state.phone || searchParams.get('phone') || '').trim(),
            purpose: String(state.purpose || searchParams.get('purpose') || '').trim() || 'login',
            redirect: String(state.redirect || searchParams.get('redirect') || '').trim(),
        };
    }, [location?.state, searchParams]);

    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await verifyOtp({
            phone: initial.phone,
            otp,
            purpose: initial.purpose,
        });

        if (result.success) {
            const redirectTo = initial.redirect || '/profile';
            navigate(redirectTo);
        } else {
            setError(result.error);
        }

        setLoading(false);
    };

    if (!initial.phone) {
        return (
            <div className="min-h-screen bg-[#f7f7f7] px-4 py-10 flex items-center justify-center">
                <div className="w-full max-w-md">
                    <div className="rounded-2xl bg-white border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.08)] p-6 sm:p-8 text-center">
                        <div className="inline-flex items-center justify-center h-40 w-40 rounded-2xl bg-white">
                            <img
                                src={settings?.brandLogoUrl || "/logo.png"}
                                alt="TROZZI"
                                className="h-36 w-36 object-contain"
                                loading="eager"
                            />
                        </div>
                        <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Verify OTP</h2>
                        <p className="mt-2 text-sm text-gray-600">Missing phone number. Please try again.</p>
                        <div className="mt-6">
                            <Link to="/login" className="font-semibold text-orange-600 hover:text-orange-700">Go to Login</Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f7f7f7] px-4 py-10 flex items-center justify-center">
            <div className="w-full max-w-md">
                <div className="rounded-2xl bg-white border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.08)] p-6 sm:p-8">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center h-40 w-40 rounded-2xl bg-white">
                            <img
                                src={settings?.brandLogoUrl || "/logo.png"}
                                alt="TROZZI"
                                className="h-36 w-36 object-contain"
                                loading="eager"
                            />
                        </div>
                        <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Verify OTP</h2>
                        <p className="mt-2 text-sm text-gray-600">OTP sent to {initial.phone}</p>
                    </div>

                    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label htmlFor="otp" className="text-sm font-semibold text-gray-700">OTP</label>
                            <input
                                id="otp"
                                name="otp"
                                type="tel"
                                inputMode="numeric"
                                required
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
                                placeholder="Enter OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 text-sm font-semibold disabled:opacity-50"
                        >
                            {loading ? 'Verifying...' : 'Verify & Continue'}
                        </button>
                    </form>

                    <div className="mt-4 text-center">
                        <Link to="/login" className="text-sm font-semibold text-orange-600 hover:text-orange-700">Back to Login</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OtpVerificationPage;
