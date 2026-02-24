import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../api/client';

const ContentSettingsContext = createContext(null);

const DEFAULTS = {
  brandLogoUrl: '',
  defaultAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
  bioMaxLength: 500,
  showOrderHistory: true,
  showWishlistCount: true,
  enableProfileEditing: true,
  enableCod: true,
};

export const useContentSettings = () => {
  const ctx = useContext(ContentSettingsContext);
  if (!ctx) throw new Error('useContentSettings must be used within a ContentSettingsProvider');
  return ctx;
};

export const ContentSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/content-settings');
      const data = res?.data?.data;
      if (data && typeof data === 'object') {
        setSettings({ ...DEFAULTS, ...data });
      } else {
        setSettings(DEFAULTS);
      }
    } catch (_e) {
      setSettings(DEFAULTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const value = useMemo(
    () => ({
      settings,
      loading,
      refresh,
    }),
    [settings, loading],
  );

  return <ContentSettingsContext.Provider value={value}>{children}</ContentSettingsContext.Provider>;
};

export default ContentSettingsProvider;
