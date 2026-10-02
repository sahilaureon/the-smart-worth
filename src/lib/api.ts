import { CONFIG } from './config';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const TSW_SHIELD_SECRET = 'TSW_PRIVACY_SHIELD_2026_KEY_99X';
const TSW_PUBLIC_CLIENT_KEY = 'tsw-internal-web-v1';

export function computeTswSignature(ts: string): string {
  const raw = `${ts}:${TSW_SHIELD_SECRET}:${TSW_PUBLIC_CLIENT_KEY}`;
  let h1 = 0x811c9dc5;
  for (let i = 0; i < raw.length; i++) {
    h1 ^= raw.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193);
  }
  return (h1 >>> 0).toString(16).padStart(8, '0');
}

function decodeTswPayload(encodedBase64: string, seedKey: string): string {
  const binaryStr = atob(encodedBase64);
  const len = binaryStr.length;
  const bytes = new Uint8Array(len);
  const keyBytes = new TextEncoder().encode(`${TSW_SHIELD_SECRET}:${seedKey}`);
  const kLen = keyBytes.length;
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryStr.charCodeAt(i) ^ keyBytes[i % kLen] ^ ((i * 31) & 0xff);
  }
  return new TextDecoder('utf-8').decode(bytes);
}

async function unwrapProtectedResponse(res: Response): Promise<Response> {
  try {
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return res;
    }
    const cloned = res.clone();
    const json = await cloned.json();
    if (json && json._tsw_enc === true && typeof json.d === 'string' && typeof json.s === 'string') {
      const decodedJsonStr = decodeTswPayload(json.d, json.s);
      return new Response(decodedJsonStr, {
        status: res.status,
        statusText: res.statusText,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }
  } catch {
    // Return original response if not encrypted or on parse fallback
  }
  return res;
}

function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isValidId(id: any): id is string {
  return typeof id === 'string' && id.trim().length >= 8 && id !== 'undefined' && id !== 'null';
}

function isValidEmail(email: any): email is string {
  return typeof email === 'string' && email.includes('@') && email !== 'undefined' && email !== 'null';
}

export function getStoredAuthContext(): {
  token?: string;
  userId?: string;
  userEmail?: string;
  user?: any;
} {
  let token: string | undefined;
  let userId: string | undefined;
  let userEmail: string | undefined;
  let userObj: any = undefined;

  try {
    const saved = localStorage.getItem('tsw_fallback_session');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.access_token && typeof parsed.access_token === 'string') {
        token = parsed.access_token;
      }
      if (parsed?.user && isValidId(parsed.user.id) && isValidEmail(parsed.user.email)) {
        userObj = parsed.user;
        userId = parsed.user.id;
        userEmail = parsed.user.email;
      } else if (parsed?.user && (!isValidId(parsed.user.id) || !isValidEmail(parsed.user.email))) {
        localStorage.removeItem('tsw_fallback_session');
      }
    }
  } catch {}

  if (!token || !userId || !userEmail) {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            const session = parsed?.currentSession || parsed?.session || parsed;
            if (!token && session?.access_token && typeof session.access_token === 'string') {
              token = session.access_token;
            }
            if (session?.user && isValidId(session.user.id) && isValidEmail(session.user.email)) {
              if (!userObj) userObj = session.user;
              if (!userId) userId = session.user.id;
              if (!userEmail) userEmail = session.user.email;
            }
          }
        }
      }
    } catch {}
  }

  if (token && (!userId || !userEmail)) {
    const claims = decodeJwtPayload(token);
    if (claims) {
      const claimId = claims.sub || claims.id;
      if (!userId && isValidId(claimId)) userId = String(claimId);
      if (!userEmail && isValidEmail(claims.email)) userEmail = String(claims.email);
      if (!userObj && userId && userEmail) {
        userObj = {
          id: userId,
          email: userEmail,
          user_metadata: {
            full_name: claims.user_metadata?.full_name || userEmail.split('@')[0]
          }
        };
      }
    }
  }

  // Never attach an oversized JWT (>4KB, e.g. containing base64 avatar) as an HTTP header
  const safeHeaderToken = token && token.length <= 4000 ? token : undefined;

  return { token: safeHeaderToken, userId, userEmail, user: userObj };
}

export async function fetchApi(path: string, options: RequestInit = {}): Promise<Response> {
  const normalizedPath = path.startsWith('/api/')
    ? path.slice(4)
    : path.startsWith('/')
    ? path
    : `/${path}`;

  const localUrl = path.startsWith('http') ? path : `/api${normalizedPath}`;
  const externalUrl =
    !path.startsWith('http') &&
    CONFIG.BACKEND_URL &&
    CONFIG.BACKEND_URL !== '/api'
      ? `${CONFIG.BACKEND_URL.replace(/\/+$/, '')}${normalizedPath}`
      : null;

  const { token, userId, userEmail } = getStoredAuthContext();
  const ts = String(Date.now());
  const sig = computeTswSignature(ts);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'TSW-Shield-v1',
    'X-TSW-Key': TSW_PUBLIC_CLIENT_KEY,
    'X-TSW-Ts': ts,
    'X-TSW-Sig': sig,
    ...(options.headers as Record<string, string>),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(userId ? { 'X-User-Id': String(userId) } : {}),
    ...(userEmail ? { 'X-User-Email': String(userEmail) } : {})
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch(localUrl, {
        ...options,
        signal: controller.signal,
        headers
      });
      clearTimeout(timeoutId);

      if ((res.status === 502 || res.status === 503 || res.status === 504) && attempt < 2) {
        await sleep(500 * (attempt + 1));
        continue;
      }

      if (res.status !== 404 || !externalUrl) {
        return await unwrapProtectedResponse(res);
      }
      break;
    } catch {
      clearTimeout(timeoutId);
      if (attempt < 2) {
        await sleep(500 * (attempt + 1));
        continue;
      }
    }
  }

  if (externalUrl) {
    try {
      const extRes = await fetch(externalUrl, {
        ...options,
        headers
      });
      return await unwrapProtectedResponse(extRes);
    } catch {}
  }

  return new Response(
    JSON.stringify({ error: 'Service temporarily unavailable. Please try again.' }),
    {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
