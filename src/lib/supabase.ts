import { createClient } from '@supabase/supabase-js';
import { fetchApi } from './api';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const safeUrl = supabaseUrl || 'https://placeholder-url.supabase.co';
const safeKey = supabaseAnonKey || 'placeholder-key';

export function isValidAuthUser(u: any): boolean {
  return Boolean(
    u &&
      typeof u === 'object' &&
      typeof u.id === 'string' &&
      u.id.trim().length >= 8 &&
      u.id !== 'undefined' &&
      u.id !== 'null' &&
      typeof u.email === 'string' &&
      u.email.includes('@')
  );
}

export function sanitizeStoredAuthSessions(): void {
  try {
    const saved = localStorage.getItem('tsw_fallback_session');
    if (saved) {
      const parsed = JSON.parse(saved);
      const userObj = parsed?.user;
      if (!isValidAuthUser(userObj)) {
        localStorage.removeItem('tsw_fallback_session');
      } else {
        let modified = false;
        if (userObj.user_metadata?.profile_pic && String(userObj.user_metadata.profile_pic).length > 500) {
          delete userObj.user_metadata.profile_pic;
          modified = true;
        }
        if (parsed.access_token && String(parsed.access_token).length > 4000) {
          delete parsed.access_token;
          delete parsed.refresh_token;
          modified = true;
        }
        if (modified) {
          localStorage.setItem('tsw_fallback_session', JSON.stringify(parsed));
        }
      }
    }
  } catch {
    try {
      localStorage.removeItem('tsw_fallback_session');
    } catch {}
  }

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            const session = parsed?.currentSession || parsed?.session || parsed;
            const token = session?.access_token || '';
            if (!isValidAuthUser(session?.user) || String(token).length > 4000) {
              keysToRemove.push(key);
            }
          } catch {
            keysToRemove.push(key);
          }
        }
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

sanitizeStoredAuthSessions();

// Safe fetch wrapper for Supabase client so direct browser calls to supabase.co never throw uncaught "Failed to fetch"
// and never return a fake 200 user object on /auth/v1/ endpoints.
const safeSupabaseFetch: typeof fetch = async (input, init) => {
  const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as any)?.url || '';
  try {
    const headers = new Headers(init?.headers || {});
    const authHeader = headers.get('Authorization') || '';
    if (authHeader.length > 4000) {
      return new Response(JSON.stringify({ message: 'Token too large', error: 'invalid_token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return await fetch(input, init);
  } catch {
    if (urlStr.includes('/auth/v1/')) {
      return new Response(JSON.stringify({ message: 'Auth session unavailable', error: 'unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: true,
    detectSessionInUrl: false
  },
  global: {
    fetch: safeSupabaseFetch
  }
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Invoke a secure admin function on the backend with automatic retry
 */
export const invokeAdminFunction = async (functionName: string, body?: any) => {
  const cleanName = functionName.startsWith('/') ? functionName : `/${functionName}`;

  let lastError: any = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetchApi(cleanName, {
        method: 'POST',
        body: JSON.stringify(body || {})
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => null);
        if (errBody && errBody.error) {
          throw new Error(errBody.error);
        }
        if (attempt < 2) {
          await sleep(800 * (attempt + 1));
          continue;
        }
        return [];
      }

      return await response.json();
    } catch (err: any) {
      lastError = err;
      if (attempt < 2) {
        await sleep(800 * (attempt + 1));
        continue;
      }
    }
  }

  if (lastError) {
    console.warn('[Admin API] Using fallback response:', lastError?.message);
  }
  return [];
};

/**
 * Utility to check Supabase connection
 */
export const checkSupabaseConnection = async () => {
  try {
    const res = await fetchApi('/health');
    return res.ok;
  } catch {
    return false;
  }
};
