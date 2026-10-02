import { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';

let cachedPackages: any[] | null = null;
let inFlightPromise: Promise<any[]> | null = null;

async function loadPackagesShared(): Promise<any[]> {
  if (inFlightPromise) return inFlightPromise;

  inFlightPromise = (async () => {
    try {
      const response = await fetchApi('/packages');
      if (!response.ok) {
        return cachedPackages || [];
      }
      const data = await response.json();
      const fetchedPackages = Array.isArray(data)
        ? data
        : data?.packages || data?.data || data?.raw || [];
      cachedPackages = fetchedPackages;
      return fetchedPackages;
    } catch {
      return cachedPackages || [];
    } finally {
      inFlightPromise = null;
    }
  })();

  return inFlightPromise;
}

export function usePackages() {
  const [packages, setPackages] = useState<any[]>(cachedPackages || []);
  const [loading, setLoading] = useState<boolean>(cachedPackages === null);
  const [error, setError] = useState<any>(null);

  const fetchPackages = async (forceRefresh = false) => {
    if (forceRefresh) {
      inFlightPromise = null;
    }
    if (!cachedPackages) {
      setLoading(true);
    }
    try {
      const list = await loadPackagesShared();
      setPackages(list);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages(false);
    const onFastReload = () => fetchPackages(true);
    window.addEventListener('app-fast-reload', onFastReload);
    return () => window.removeEventListener('app-fast-reload', onFastReload);
  }, []);

  return {
    packages,
    loading,
    error,
    refresh: () => fetchPackages(true)
  };
}
