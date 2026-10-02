import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { fetchApi } from '../lib/api';

interface SiteSettings {
  [key: string]: string;
}

interface SettingsContextType {
  settings: SiteSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: {},
  loading: true,
  refreshSettings: async () => {},
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<SiteSettings>({
    site_title: 'The Smart Worth',
    site_description: 'Discover skills that build your career with The Smart Worth.'
  });
  const [loading, setLoading] = useState(false);

  const fetchSettings = async () => {
    try {
      const response = await fetchApi('/site-settings');
      if (!response.ok) return;
      const data = await response.json();
      if (data && typeof data === 'object') {
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch {
      // Keep default site settings on transient network hiccup
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    const onFastReload = () => fetchSettings();
    window.addEventListener('app-fast-reload', onFastReload);
    return () => {
      window.removeEventListener('app-fast-reload', onFastReload);
    };
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
