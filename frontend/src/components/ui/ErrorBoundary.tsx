import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Bug, Copy, Check } from 'lucide-react';
import { AppError } from '@/types';

interface Props {
  readonly children?: ReactNode;
  readonly fallback?: ReactNode;
  readonly onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  readonly hasError: boolean;
  readonly error: Error | null;
  readonly errorInfo: ErrorInfo | null;
  readonly copiedToClipboard: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copiedToClipboard: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      copiedToClipboard: false
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);

    // Enhanced error logging
    const errorReport: AppError = {
      code: 'REACT_ERROR_BOUNDARY',
      message: error.message,
      details: {
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    };

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Store error report for debugging
    this.setState({
      errorInfo,
      copiedToClipboard: false
    });

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // Send to error reporting service (e.g., Sentry, LogRocket)
      console.warn('Error report:', errorReport);
    }
  }

  private handleCopyError = async () => {
    if (!this.state.error) return;

    const errorDetails = {
      message: this.state.error.message,
      stack: this.state.error.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
      this.setState({ copiedToClipboard: true });
      setTimeout(() => this.setState({ copiedToClipboard: false }), 2000);
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      copiedToClipboard: false
    });
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, copiedToClipboard } = this.state;

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white p-4">
          <div className="max-w-lg w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bug size={32} className="text-red-500" />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold mb-3">애플리케이션 오류</h1>

            <p className="text-neutral-400 mb-6 text-sm sm:text-base leading-relaxed">
              예기치 않은 오류가 발생했습니다.<br/>
              아래 정보를 복사하여 개발팀에 보고해주세요.
            </p>

            {/* Error Details */}
            <div className="bg-neutral-950 rounded-lg p-4 mb-6 text-left border border-neutral-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  오류 세부정보
                </span>
                <button
                  onClick={this.handleCopyError}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                    copiedToClipboard
                      ? 'bg-green-900/20 text-green-400'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400'
                  }`}
                  title="오류 정보 복사"
                >
                  {copiedToClipboard ? (
                    <>
                      <Check size={12} />
                      복사됨
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      복사
                    </>
                  )}
                </button>
              </div>

              <div className="overflow-auto max-h-32">
                <code className="text-xs text-red-400 font-mono leading-relaxed block">
                  {error?.message || 'Unknown error'}
                </code>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-neutral-800 text-white font-medium rounded-xl hover:bg-neutral-700 transition-colors"
              >
                다시 시도
              </button>

              <button
                onClick={() => window.location.reload()}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-colors"
              >
                <RefreshCw size={16} />
                새로고침
              </button>
            </div>

            {/* Development Info */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-neutral-500 cursor-pointer hover:text-neutral-400">
                  개발자 정보 (펼쳐보기)
                </summary>
                <pre className="text-xs text-neutral-600 mt-2 p-2 bg-neutral-950 rounded border overflow-auto max-h-40">
                  {error?.stack}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      {'\n\nComponent Stack:'}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}