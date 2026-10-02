import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

console.log('[App] Starting initialization...');

// Global error listener to catch issues before React even tries to mount
window.addEventListener('error', (event) => {
  console.error('[GLOBAL_ERROR]', event.error || event.message);
  const root = document.getElementById('root');
  if (root && root.innerHTML === '') {
    root.innerHTML = `<div style="font-family:sans-serif;padding:2rem;text-align:center;">
      <h1 style="color:#0A0E27;font-weight:900;">Initialization Issue</h1>
      <p style="color:#64748b;font-size:14px;margin-bottom:20px;">The platform is having trouble starting. This is usually temporary.</p>
      <button onclick="location.reload()" style="padding:12px 24px;background:#615DFA;color:white;border:none;border-radius:99px;font-weight:bold;cursor:pointer;box-shadow:0 4px 12px rgba(97,93,250,0.3);">Refresh Now</button>
    </div>`;
  }
});

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('[App] Failed to find root element');
  document.body.innerHTML = `
    <div style="height:100vh;display:flex;align-items:center;justify-content:center;font-family:sans-serif;background:#f8f9fa;">
      <div style="text-align:center;padding:2rem;max-width:400px;background:white;border-radius:32px;box-shadow:0 20px 60px rgba(0,0,0,0.05);border:1px solid #f1f5f9;">
        <h1 style="font-weight:900;margin-bottom:12px;color:#0f172a;">Almost ready</h1>
        <p style="color:#64748b;font-size:14px;line-height:1.6;">The platform setup is being prepared. Please refresh to start your experience.</p>
        <button onclick="location.reload()" style="margin-top:24px;width:100%;padding:14px;background:#615DFA;color:white;border:none;border-radius:99px;font-weight:bold;cursor:pointer;box-shadow:0 4px 12px rgba(97,93,250,0.3);">Refresh Now</button>
      </div>
    </div>
  `;
} else {
  try {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    );
    // Clear the fallback timeout and injected UI since React has taken over
    if ((window as any)._app_timeout) {
      clearTimeout((window as any)._app_timeout);
    }
    console.log('[App] Rendered to DOM');
  } catch (error: any) {
    console.error('[App] Initial render crash:', error);
    rootElement.innerHTML = `
      <div style="padding:40px;text-align:center;font-family:sans-serif;">
        <h1 style="color:#0A0E27;font-weight:900;">Initialization Delay</h1>
        <p style="color:#64748b;">The platform is taking a moment to load. Please try refreshing.</p>
        <button onclick="location.reload()" style="margin-top:24px;padding:12px 24px;background:#615DFA;color:white;border:none;border-radius:99px;font-weight:bold;cursor:pointer;box-shadow:0 4px 12px rgba(97,93,250,0.3);">Refresh Now</button>
      </div>
    `;
  }
}
