import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import BrutalistButton from './BrutalistButton';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] p-4 font-sans">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-10 border border-gray-50 text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="text-rose-500" size={32} />
            </div>
            <h2 className="text-2xl font-black text-[#0A0E27] mb-4 tracking-tight">App Error</h2>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              Something went wrong while loading the application. This might be a temporary issue.
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => window.location.reload()}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#615DFA',
                  color: 'white',
                  borderRadius: '12px',
                  fontWeight: 900,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Try Reloading App
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Return to Home
              </button>
            </div>
            {import.meta.env.DEV && (
              <div className="mt-8 p-4 bg-gray-50 rounded-xl text-left overflow-auto max-h-40">
                <p className="text-[10px] font-mono text-rose-600 font-medium mb-1">Error Trace:</p>
                <p className="text-[10px] font-mono text-gray-600 whitespace-pre-wrap">{this.state.error?.stack || this.state.error?.message}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
