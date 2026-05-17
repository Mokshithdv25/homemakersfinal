import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ArrowRight, ArrowLeft, Check, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HM_HEADER_BAR_CHROME_CLASS, HM_WORDMARK_TITLE_CLASS, hmLogoMarkSrc } from "../lib/hmBrand";
import { getSupabase } from "../lib/supabaseClient";
import { fetchUserProfile, persistHmSessionFromSupabase, upsertUserProfile } from "../lib/userProfileApi";

/**
 * Sign-in: Supabase Auth — email/password and Google OAuth when env vars are set.
 * Phone OTP remains a demo flow until enabled in Supabase.
 */
export default function SignInPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modeFromQuery = searchParams.get("mode") === "signup" ? "signup" : "signin";
  const roleFromQuery = searchParams.get("role") === "pro" ? "pro" : "homeowner";

  const [step, setStep] = useState("entry");
  const [mode, setMode] = useState(modeFromQuery);
  const [accountRole, setAccountRole] = useState(roleFromQuery);
  const [authMethod, setAuthMethod] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [authError, setAuthError] = useState("");

  const isSignUp = mode === "signup";
  const supabaseConfigured = Boolean(getSupabase());

  const otpRefs = useRef([]);
  const oauthReturnHandled = useRef(false);

  useEffect(() => {
    if (searchParams.get("mode") === "signup") setMode("signup");
    if (searchParams.get("role") === "pro") setAccountRole("pro");
  }, [searchParams]);

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const handleSendOTP = async () => {
    if (phone.length < 10) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setStep("otp");
    setResendTimer(30);
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  const handleGoogleSignIn = async () => {
    setAuthError("");
    const sb = getSupabase();
    if (!sb) {
      setAuthError("Supabase is not configured. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("role", accountRole);
      if (isSignUp) params.set("mode", "signup");
      const redirectTo = `${window.location.origin}/sign-in?${params.toString()}`;
      const { error } = await sb.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) throw error;
      /* Browser leaves the app for Google; session resumes on redirectTo. */
    } catch (err) {
      setAuthError(err?.message || "Google sign-in failed. Check Supabase Google provider settings.");
      setLoading(false);
    }
  };

  const tryFinishEmailAuth = async (session) => {
    const user = session.user;
    let profile = null;
    try {
      profile = await fetchUserProfile(user.id);
    } catch (_) {
      /* user_profiles table or policies not ready — continue to profile step */
    }
    const resolvedRole = profile?.role || user.user_metadata?.role || accountRole;
    if (profile?.full_name?.trim()) {
      persistHmSessionFromSupabase(user, profile);
      navigate(resolvedRole === "pro" ? "/pro/dashboard" : "/", { replace: true });
      return;
    }
    const meta = user.user_metadata || {};
    const googleName =
      profile?.full_name ||
      meta.full_name ||
      meta.name ||
      [meta.given_name, meta.family_name].filter(Boolean).join(" ");
    setName(googleName || "");
    setEmail(user.email || authEmail);
    setCity(profile?.city || "");
    if (profile?.phone) {
      const digits = String(profile.phone).replace(/\D/g, "");
      if (digits.length >= 10) setPhone(digits.slice(-10));
    }
    setStep("details");
  };

  /** After Google OAuth redirect, Supabase puts tokens in the URL hash — finish sign-in here. */
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return undefined;

    const roleFromUrl = searchParams.get("role");
    if (roleFromUrl === "pro" || roleFromUrl === "homeowner") {
      setAccountRole(roleFromUrl);
    }

    const finishOAuthReturn = async (session) => {
      if (!session?.user || oauthReturnHandled.current) return;
      oauthReturnHandled.current = true;
      setLoading(true);
      setAuthError("");
      try {
        const role = roleFromUrl === "pro" || roleFromUrl === "homeowner" ? roleFromUrl : accountRole;
        if (role && !session.user.user_metadata?.role) {
          await sb.auth.updateUser({ data: { role } });
        }
        await tryFinishEmailAuth(session);
      } catch (err) {
        setAuthError(err?.message || "Could not complete Google sign-in.");
      } finally {
        setLoading(false);
        if (window.location.hash) {
          window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
        }
      }
    };

    const hash = window.location.hash?.slice(1) || "";
    const hashParams = new URLSearchParams(hash);
    if (hashParams.get("error_description")) {
      setAuthError(decodeURIComponent(hashParams.get("error_description").replace(/\+/g, " ")));
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      return undefined;
    }

    const isOAuthReturn = hashParams.has("access_token") || hashParams.has("code");
    if (!isOAuthReturn) return undefined;

    sb.auth.getSession().then(({ data: { session } }) => {
      if (session) finishOAuthReturn(session);
    });

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) finishOAuthReturn(session);
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- OAuth return only
  }, []);

  const handleEmailSignIn = async () => {
    if (!authEmail || !authPassword) return;
    if (isSignUp && authPassword !== confirmPassword) return;
    if (authPassword.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }
    setAuthError("");
    setLoading(true);
    try {
      const sb = getSupabase();
      if (sb) {
        if (isSignUp) {
          const { data, error } = await sb.auth.signUp({
            email: authEmail.trim(),
            password: authPassword,
            options: {
              data: { role: accountRole },
              emailRedirectTo: `${window.location.origin}/`,
            },
          });
          if (error) throw error;
          if (!data.session) {
            setAuthError(
              "Check your email to confirm this address (if confirmation is enabled), then sign in here.",
            );
            return;
          }
          await tryFinishEmailAuth(data.session);
        } else {
          const { data, error } = await sb.auth.signInWithPassword({
            email: authEmail.trim(),
            password: authPassword,
          });
          if (error) throw error;
          await tryFinishEmailAuth(data.session);
        }
      } else {
        await new Promise((r) => setTimeout(r, 900));
        setEmail(authEmail);
        setStep("details");
      }
    } catch (err) {
      setAuthError(err?.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    if (newOtp.every((d) => d !== "") && newOtp.join("").length === 6) {
      handleVerifyOTP();
    }
  };

  const handleOTPKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOTPPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      e.preventDefault();
      const newOtp = pasted.split("");
      setOtp(newOtp);
      handleVerifyOTP();
    }
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setStep("details");
  };

  const handleComplete = async () => {
    if (!name.trim()) return;
    setAuthError("");
    setLoading(true);
    try {
      const sb = getSupabase();
      if (sb) {
        const {
          data: { session },
        } = await sb.auth.getSession();
        if (session?.user) {
          await upsertUserProfile({
            fullName: name.trim(),
            phone: phone ? `+91${phone}` : "",
            city: city.trim() || null,
            role: accountRole,
          });
          let profile = null;
          try {
            profile = await fetchUserProfile(session.user.id);
          } catch (_) {
            /* ignore */
          }
          persistHmSessionFromSupabase(session.user, profile);
        }
      } else {
        await new Promise((r) => setTimeout(r, 800));
        const profile = { phone: phone ? `+91${phone}` : "", name, email, city };
        try {
          localStorage.setItem("hmUser", JSON.stringify(profile));
          localStorage.setItem(
            "hmSession",
            JSON.stringify({
              role: accountRole,
              signedInAt: new Date().toISOString(),
              profile,
            }),
          );
        } catch (_) {
          // ignore
        }
      }
      setStep("done");
      setTimeout(() => {
        navigate(accountRole === "pro" ? "/pro/dashboard" : "/", { replace: true });
      }, 1800);
    } catch (err) {
      setAuthError(err?.message || "Could not save your profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = () => {
    if (resendTimer > 0) return;
    setOtp(["", "", "", "", "", ""]);
    setResendTimer(30);
    otpRefs.current[0]?.focus();
  };

  return (
    <div className="hm-landing-page min-h-screen bg-background flex flex-col">
      {/* Top Bar — same chrome + lockup as marketing home */}
      <div
        className={`flex items-center justify-between gap-4 px-5 md:px-10 py-3 min-h-[4.65rem] ${HM_HEADER_BAR_CHROME_CLASS}`}
      >
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 bg-transparent border-none cursor-pointer p-0"
        >
          <img
            src={hmLogoMarkSrc}
            alt="HomeMakers"
            className="w-12 h-12 md:w-[60px] md:h-[60px] shrink-0"
            width={60}
            height={60}
            decoding="async"
          />
          <span className={HM_WORDMARK_TITLE_CLASS}>HomeMakers</span>
        </button>
        <button
          type="button"
          onClick={step === "otp" ? () => setStep("entry") : goBack}
          className={`flex items-center gap-1.5 text-muted-foreground font-body text-sm hover:text-foreground transition-colors bg-transparent border-none cursor-pointer ${
            step === "details" || step === "done" ? "invisible" : ""
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          {step === "otp" ? "Change number" : "Back"}
        </button>
      </div>

      {/* Centered Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {/* ─── ENTRY STEP ─── */}
            {step === "entry" && (
              <motion.div
                key="entry"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-7"
              >
                <div className="text-center">
                  <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                    {isSignUp ? "Create Account" : "Sign In"}
                  </h2>
                  <p className="text-muted-foreground font-body text-base">
                    {isSignUp
                      ? "Join HomeMakers and bring your dream home to life."
                      : "Sign in to start your homemaking journey."}
                  </p>
                </div>

                  <div className="rounded-xl border-2 border-border p-1.5 bg-card">
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setAccountRole("homeowner")}
                        className={`rounded-lg px-3 py-2 text-sm font-body font-semibold transition-colors ${
                          accountRole === "homeowner"
                            ? "bg-accent/15 text-copper"
                            : "text-muted-foreground hover:bg-muted/40"
                        }`}
                      >
                        Homeowner
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccountRole("pro")}
                        className={`rounded-lg px-3 py-2 text-sm font-body font-semibold transition-colors ${
                          accountRole === "pro"
                            ? "bg-accent/15 text-copper"
                            : "text-muted-foreground hover:bg-muted/40"
                        }`}
                      >
                        Professional
                      </button>
                    </div>
                    <p className="mt-2 px-1 text-[11px] leading-relaxed text-muted-foreground font-body">
                      {accountRole === "pro"
                        ? "You will land in the pro dashboard after login."
                        : "You will land in the homeowner experience after login."}
                    </p>
                  </div>

                  {authError && step === "entry" ? (
                    <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 font-body text-sm text-destructive">
                      {authError}
                    </p>
                  ) : null}

                  {/* Google */}
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl border-2 border-border hover:border-foreground/20 hover:bg-muted/30 transition-all font-body text-sm font-medium text-foreground"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                    )}
                    Continue with Google
                  </button>
                  {!supabaseConfigured ? (
                    <p className="text-center font-body text-[11px] text-muted-foreground">
                      Google sign-in needs Supabase env vars (local <code className="text-[10px]">.env</code> or Vercel).
                    </p>
                  ) : (
                    <p className="text-center font-body text-[11px] text-muted-foreground">
                      Secure sign-in via Google — account stored in Supabase.
                    </p>
                  )}

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-background px-4 text-muted-foreground font-body text-xs uppercase tracking-wider">
                        or continue with
                      </span>
                    </div>
                  </div>

                  {/* Auth Method Tabs */}
                  <div className="flex rounded-xl border-2 border-border overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setAuthMethod("phone")}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 font-body text-sm font-medium transition-all ${
                        authMethod === "phone"
                          ? "bg-accent/10 text-copper border-r-2 border-border"
                          : "text-muted-foreground hover:bg-muted/30 border-r-2 border-border"
                      }`}
                    >
                      <Phone className="w-4 h-4" />
                      Phone
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMethod("email")}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 font-body text-sm font-medium transition-all ${
                        authMethod === "email"
                          ? "bg-accent/10 text-copper"
                          : "text-muted-foreground hover:bg-muted/30"
                      }`}
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </button>
                  </div>

                  {/* Phone Input */}
                  {authMethod === "phone" && (
                    <>
                      <div className="space-y-3">
                        <Label className="font-body text-sm font-semibold block">
                          Phone Number
                        </Label>
                        <div className="flex gap-2">
                          <div className="flex items-center px-3.5 rounded-xl border-2 border-border bg-muted/30 font-body text-sm text-foreground shrink-0">
                            🇮🇳 +91
                          </div>
                          <Input
                            type="tel"
                            placeholder="98765 43210"
                            value={phone}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                              setPhone(val);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && phone.length === 10) handleSendOTP();
                            }}
                            className="font-body text-base tracking-wide rounded-xl border-2 h-12"
                          />
                        </div>
                      </div>

                      <Button
                        onClick={handleSendOTP}
                        disabled={phone.length < 10 || loading}
                        className="w-full gradient-copper text-primary-foreground font-body rounded-xl py-6 text-sm font-semibold"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Phone className="w-4 h-4 mr-2" />
                        )}
                        {loading ? "Sending OTP..." : (isSignUp ? "Send OTP to verify" : "Send OTP")}
                      </Button>
                    </>
                  )}

                  {/* Email Input */}
                  {authMethod === "email" && (
                    <>
                      {getSupabase() ? (
                        <p className="text-[11px] leading-relaxed text-muted-foreground font-body text-center">
                          Email sign-in saves your account in Supabase (upgrade to OAuth / phone OTP when you enable them in the dashboard).
                        </p>
                      ) : (
                        <p className="text-[11px] leading-relaxed text-amber-800/90 font-body text-center rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2">
                          Demo mode: Supabase env vars are missing, so this device only stores a local session after you finish the profile step.
                        </p>
                      )}
                      <div className="space-y-4">
                        <div>
                          <Label className="font-body text-sm font-semibold mb-1.5 block">
                            Email Address
                          </Label>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            value={authEmail}
                            onChange={(e) => setAuthEmail(e.target.value)}
                            className="font-body rounded-xl border-2 h-12"
                          />
                        </div>
                        <div>
                          <Label className="font-body text-sm font-semibold mb-1.5 block">
                            {isSignUp ? "Create Password" : "Password"}
                          </Label>
                          <Input
                            type="password"
                            placeholder={isSignUp ? "Min. 8 characters" : "Enter your password"}
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !isSignUp && authEmail && authPassword) handleEmailSignIn();
                            }}
                            className="font-body rounded-xl border-2 h-12"
                          />
                          {!isSignUp && (
                            <div className="flex justify-end mt-1">
                              <button type="button" className="text-copper font-body text-xs font-medium hover:underline">
                                Forgot password?
                              </button>
                            </div>
                          )}
                        </div>
                        {isSignUp && (
                          <div>
                            <Label className="font-body text-sm font-semibold mb-1.5 block">
                              Confirm Password
                            </Label>
                            <Input
                              type="password"
                              placeholder="Re-enter your password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && authEmail && authPassword && confirmPassword === authPassword) handleEmailSignIn();
                              }}
                              className={`font-body rounded-xl border-2 h-12 ${
                                confirmPassword && confirmPassword !== authPassword
                                  ? "border-destructive focus-visible:ring-destructive/30"
                                  : ""
                              }`}
                            />
                            {confirmPassword && confirmPassword !== authPassword && (
                              <p className="text-destructive font-body text-xs mt-1">Passwords don't match</p>
                            )}
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={handleEmailSignIn}
                        disabled={!authEmail || !authPassword || (isSignUp && authPassword !== confirmPassword) || loading}
                        className="w-full gradient-copper text-primary-foreground font-body rounded-xl py-6 text-sm font-semibold"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Mail className="w-4 h-4 mr-2" />
                        )}
                        {loading
                          ? (isSignUp ? "Creating account..." : "Signing in...")
                          : (isSignUp ? "Create Account" : "Sign In with Email")}
                      </Button>
                    </>
                  )}

                  <p className="text-muted-foreground font-body text-[11px] text-center leading-relaxed">
                    By continuing, you agree to HomeMakers&apos;{" "}
                    <button type="button" className="text-copper hover:underline">Terms of Service</button>
                    {" "}and{" "}
                    <button type="button" className="text-copper hover:underline">Privacy Policy</button>
                  </p>

                  {/* Mode Toggle */}
                  <div className="pt-2 border-t border-border">
                    <p className="text-center font-body text-sm text-muted-foreground">
                      {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setMode(isSignUp ? "signin" : "signup");
                          setAuthPassword("");
                          setConfirmPassword("");
                          setAuthError("");
                        }}
                        className="text-copper font-semibold hover:underline"
                      >
                        {isSignUp ? "Sign In" : "Sign Up"}
                      </button>
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ─── OTP STEP ─── */}
              {step === "otp" && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <div>
                    <h2 className="font-display text-3xl font-bold text-foreground mb-2">
                      Verify your number
                    </h2>
                    <p className="text-muted-foreground font-body text-base">
                      We sent a 6-digit code to{" "}
                      <span className="text-foreground font-semibold">+91 {phone}</span>
                    </p>
                  </div>

                  {/* OTP Input */}
                  <div className="flex gap-3 justify-center" onPaste={handleOTPPaste}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOTPChange(i, e.target.value)}
                        onKeyDown={(e) => handleOTPKeyDown(i, e)}
                        className={`w-14 h-16 text-center text-2xl font-body font-bold rounded-xl border-2 transition-all outline-none ${
                          digit
                            ? "border-accent bg-accent/5 text-foreground"
                            : "border-border bg-card text-foreground focus:border-accent focus:ring-2 focus:ring-accent/20"
                        }`}
                      />
                    ))}
                  </div>

                  {loading && (
                    <div className="flex items-center justify-center gap-2 text-copper font-body text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying...
                    </div>
                  )}

                  <div className="text-center space-y-3">
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={resendTimer > 0}
                      className={`font-body text-sm font-medium transition-colors ${
                        resendTimer > 0
                          ? "text-muted-foreground cursor-not-allowed"
                          : "text-copper hover:underline"
                      }`}
                    >
                      {resendTimer > 0
                        ? `Resend OTP in ${resendTimer}s`
                        : "Didn't receive it? Resend OTP"}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ─── DETAILS STEP ─── */}
              {step === "details" && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="font-display text-3xl font-bold text-foreground mb-2">
                      Complete your profile
                    </h2>
                    <p className="text-muted-foreground font-body text-base">
                      Just a few details so we can personalize your experience.
                    </p>
                  </div>

                  {phone && (
                    <div className="p-3 rounded-xl bg-green-50 border border-green-200 flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="font-body text-sm text-green-700 font-medium">
                        +91 {phone} verified
                      </span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <Label className="font-body text-sm font-semibold mb-1.5 block">
                        Full Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        placeholder="e.g., Rahul Sharma"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="font-body rounded-xl border-2 h-12"
                        autoFocus
                      />
                    </div>

                    <div>
                      <Label className="font-body text-sm font-semibold mb-1.5 block">
                        Email{" "}
                        <span className="text-muted-foreground text-xs font-normal">
                          (for design PDFs & updates)
                        </span>
                      </Label>
                      <Input
                        type="email"
                        placeholder="rahul@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="font-body rounded-xl border-2 h-12"
                      />
                    </div>

                    <div>
                      <Label className="font-body text-sm font-semibold mb-1.5 block">
                        City{" "}
                        <span className="text-muted-foreground text-xs font-normal">
                          (for local rates & pros)
                        </span>
                      </Label>
                      <Input
                        placeholder="e.g., Bangalore"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && name.trim()) handleComplete();
                        }}
                        className="font-body rounded-xl border-2 h-12"
                      />
                    </div>
                  </div>

                  {authError && step === "details" ? (
                    <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 font-body text-sm text-destructive">
                      {authError}
                    </p>
                  ) : null}

                  <Button
                    onClick={handleComplete}
                    disabled={!name.trim() || loading}
                    className="w-full gradient-copper text-primary-foreground font-body rounded-xl py-6 text-sm font-semibold"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <ArrowRight className="w-4 h-4 mr-2" />
                    )}
                    {loading ? "Setting up..." : "Get Started"}
                  </Button>
                </motion.div>
              )}

              {/* ─── DONE ─── */}
              {step === "done" && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12 space-y-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                    className="w-20 h-20 rounded-full gradient-copper flex items-center justify-center mx-auto"
                  >
                    <Check className="w-10 h-10 text-primary-foreground" />
                  </motion.div>
                  <div>
                    <h3 className="font-display text-2xl font-bold text-foreground">
                      Welcome, {name.split(" ")[0]}!
                    </h3>
                    <p className="text-muted-foreground font-body text-base mt-2">
                      Your account is ready. Redirecting...
                    </p>
                  </div>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="h-1 gradient-copper rounded-full mx-auto max-w-xs"
                  />
                </motion.div>
              )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
