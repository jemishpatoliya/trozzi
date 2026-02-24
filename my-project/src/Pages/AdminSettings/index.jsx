import React, { useEffect, useMemo, useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { apiClient } from '../../api/client';

const AdminSettings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [brandLogoUrl, setBrandLogoUrl] = useState('');
    const [enableCod, setEnableCod] = useState(true);
    const [uploading, setUploading] = useState(false);

    const token = useMemo(() => localStorage.getItem('adminToken') || localStorage.getItem('token') || '', []);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await apiClient.get('/admin/content-settings', {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                const data = res?.data?.data;
                if (!cancelled) {
                    setBrandLogoUrl(String(data?.brandLogoUrl || '').trim());
                    setEnableCod(data?.enableCod !== false);
                }
            } catch (e) {
                const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Failed to load settings';
                if (!cancelled) setError(msg);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [token]);

    const onPickLogo = async (file) => {
        if (!file) return;
        setUploading(true);
        setError('');
        try {
            const form = new FormData();
            form.append('image', file);

            const res = await apiClient.post('/upload/admin-image?folder=branding', form, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const url = String(res?.data?.url || '').trim();
            if (!url) throw new Error(res?.data?.message || 'Upload failed');

            setBrandLogoUrl(url);
        } catch (e) {
            const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Logo upload failed';
            setError(msg);
        } finally {
            setUploading(false);
        }
    };

    const onSave = async () => {
        setSaving(true);
        setError('');
        try {
            const res = await apiClient.put(
                '/admin/content-settings',
                { brandLogoUrl, enableCod },
                {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                },
            );

            const data = res?.data?.data;
            setBrandLogoUrl(String(data?.brandLogoUrl || brandLogoUrl).trim());
            setEnableCod(data?.enableCod !== false);
        } catch (e) {
            const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Failed to save settings';
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminSidebar>
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                </div>

                {loading ? (
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                        {error ? (
                            <div className="border border-red-200 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        ) : null}

                        <div>
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Brand Logo</h2>
                            </div>

                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <div className="text-sm font-semibold text-gray-700 mb-2">Preview</div>
                                    <div className="h-16 flex items-center justify-center bg-gray-50 rounded-md overflow-hidden">
                                        {brandLogoUrl ? (
                                            <img src={brandLogoUrl} alt="Brand logo" className="h-12 w-auto object-contain" />
                                        ) : (
                                            <span className="text-gray-400 text-sm">No logo set</span>
                                        )}
                                    </div>
                                    <div className="mt-3 text-xs text-gray-500 break-all">{brandLogoUrl || ''}</div>
                                </div>

                                <div className="border border-gray-200 rounded-lg p-4">
                                    <div className="text-sm font-semibold text-gray-700 mb-2">Upload</div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => onPickLogo(e.target.files?.[0])}
                                        disabled={uploading}
                                        className="block w-full text-sm"
                                    />
                                    <div className="mt-3 flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={onSave}
                                            disabled={saving || uploading}
                                            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {saving ? 'Saving...' : 'Save'}
                                        </button>
                                        {uploading ? <span className="text-sm text-gray-600">Uploading...</span> : null}
                                    </div>
                                    <div className="mt-2 text-xs text-gray-500">
                                        Upload image to S3 and save. This logo will appear on Header, Login and Register pages.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Cash on Delivery</h2>
                                    <div className="text-sm text-gray-600 mt-1">Turn COD on/off for the entire store checkout.</div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setEnableCod((v) => !v)}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${enableCod ? 'bg-blue-600' : 'bg-gray-300'}`}
                                    aria-pressed={enableCod}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${enableCod ? 'translate-x-6' : 'translate-x-1'}`}
                                    />
                                </button>
                            </div>
                            <div className="mt-2 text-sm">
                                Status: <span className={`font-semibold ${enableCod ? 'text-emerald-700' : 'text-red-700'}`}>{enableCod ? 'Enabled' : 'Disabled'}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminSidebar>
    );
};

export default AdminSettings;
