import React from "react";

/** Catches render errors on /sign-in so users see a message instead of a blank page. */
export default class SignInErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[SignInPage]", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[#FBF2E8] flex items-center justify-center p-6" role="alert">
          <div className="max-w-md w-full rounded-2xl border border-[#EEDCCB] bg-white p-8 shadow-lg">
            <h1 className="text-xl font-bold text-[#1C1917] mb-2">Sign-in could not load</h1>
            <p className="text-sm text-[#57534E] mb-4 leading-relaxed">
              Something crashed in the browser. Try a hard refresh (Cmd+Shift+R). If it persists, check the
              console or confirm Vercel has <code className="text-xs">REACT_APP_SUPABASE_URL</code> and{" "}
              <code className="text-xs">REACT_APP_SUPABASE_ANON_KEY</code>.
            </p>
            <p className="text-xs text-[#78716C] font-mono break-all mb-6">{String(this.state.error?.message || this.state.error)}</p>
            <a href="/" className="text-sm font-semibold text-[#C85F2B] hover:underline">
              ← Back to home
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
