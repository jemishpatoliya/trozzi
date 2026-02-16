import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useContentSettings } from '../../context/ContentSettingsContext';

const RegisterPage = () => {
    const { settings } = useContentSettings();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const parts = String(formData.name || '').trim().split(/\s+/).filter(Boolean);
        const firstName = parts[0] || '';
        const lastName = parts.length > 1 ? parts.slice(1).join(' ') : 'User';

        const result = await register({
            firstName,
            lastName,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
        });

        if (result.success) {
            navigate('/profile');
        } else {
            setError(result.error);
        }

        setLoading(false);
    };

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
                        <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                            Create account
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link to="/login" className="font-semibold text-orange-600 hover:text-orange-700">
                                Sign in
                            </Link>
                        </p>
                    </div>

                    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label htmlFor="name" className="text-sm font-semibold text-gray-700">
                                Name
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
                                placeholder="Full name"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="email" className="text-sm font-semibold text-gray-700">
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                                Mobile number
                            </label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                inputMode="numeric"
                                required
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
                                placeholder="Enter mobile number"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="password" className="text-sm font-semibold text-gray-700">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
                                placeholder="Create password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>

                        <label className="flex items-start gap-2 text-sm text-gray-700 pt-1">
                            <input
                                id="agree-terms"
                                name="agree-terms"
                                type="checkbox"
                                required
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            />
                            <span>
                                I agree to the{' '}
                                <Link to="/terms-of-service" className="font-semibold text-orange-600 hover:text-orange-700">
                                    Terms and Conditions
                                </Link>
                            </span>
                        </label>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 text-sm font-semibold disabled:opacity-50"
                        >
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
