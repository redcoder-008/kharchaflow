import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
  TrendingUp,
  Mail,
  Lock,
  User,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Phone,
  ChevronLeft,
  ShieldCheck,
  X,
} from "lucide-react";

// ── Small inline Google SVG ──────────────────────────────────────────────────
function GoogleIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M5.27 9.76A7.08 7.08 0 0 1 12 4.9c1.84 0 3.5.67 4.8 1.76L20.1 3.4A11.88 11.88 0 0 0 12 .5C8.16.5 4.83 2.62 3.06 5.74l2.21 4.02z"
      />
      <path
        fill="#34A853"
        d="M12 23.5c3.18 0 5.88-1.05 7.85-2.85l-3.63-2.95A7.08 7.08 0 0 1 12 19.1a7.08 7.08 0 0 1-6.72-4.82L3.06 18.26C4.83 21.38 8.16 23.5 12 23.5z"
      />
      <path
        fill="#4A90D9"
        d="M22.46 12.23c0-.81-.07-1.59-.2-2.34H12v4.43h5.86a5.01 5.01 0 0 1-2.17 3.28l3.63 2.95c2.12-1.96 3.14-4.85 3.14-8.32z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.28A7.11 7.11 0 0 1 4.9 12c0-.79.14-1.56.38-2.28L3.06 5.74A11.93 11.93 0 0 0 .5 12c0 1.93.46 3.75 1.27 5.36l2.21-4.02-.71.94z"
      />
    </svg>
  );
}

// Auth mode enum
const MODE = {
  EMAIL: "email",
  PHONE: "phone",
};

// Phone step enum
const PHONE_STEP = {
  ENTER_PHONE: "enter_phone",
  ENTER_OTP: "enter_otp",
};

export default function Auth() {
  const {
    login,
    register,
    signInWithGoogle,
    resetPassword,
    sendPhoneOTP,
    confirmPhoneOTP,
    error: authError,
    isDemoMode,
    signInAsGuest,
  } = useAuth();

  const [showNoAccountPopup, setShowNoAccountPopup] = useState(false);

  const [isLoginTab, setIsLoginTab] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [authMode, setAuthMode] = useState(MODE.EMAIL); // email | phone

  // Email form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  // Phone form
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneName, setPhoneName] = useState("");
  const [phoneStep, setPhoneStep] = useState(PHONE_STEP.ENTER_PHONE);
  const confirmationRef = useRef(null);
  const recaptchaContainerId = "recaptcha-container";

  // UI states
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ── Validation ──────────────────────────────────────────────────────────────
  const handleValidation = () => {
    setValidationError("");
    if (!email) {
      setValidationError("Email address is required.");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setValidationError("Please enter a valid email address.");
      return false;
    }
    if (!isForgotPassword) {
      if (!password) {
        setValidationError("Password is required.");
        return false;
      }
      if (password.length < 6) {
        setValidationError("Password must be at least 6 characters long.");
        return false;
      }
    }
    if (!isLoginTab && !isForgotPassword && !displayName.trim()) {
      setValidationError("Please enter your full name.");
      return false;
    }
    return true;
  };

  const handlePhoneValidation = () => {
    setValidationError("");
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setValidationError(
        "Enter a valid phone number with country code (e.g. +91 98765 43210).",
      );
      return false;
    }
    return true;
  };

  // ── Email submit ────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!handleValidation()) return;
    setLoading(true);
    setValidationError("");
    setSuccessMessage("");
    try {
      if (isForgotPassword) {
        await resetPassword(email);
        setSuccessMessage("Password reset email sent! Check your inbox.");
        setEmail("");
      } else if (isLoginTab) {
        await login(email, password);
      } else {
        await register(email, password, displayName);
      }
    } catch (err) {
      setValidationError(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // ── Google sign in ──────────────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setValidationError("");
    setSuccessMessage("");
    try {
      await signInWithGoogle();
    } catch (err) {
      setValidationError(err.message || "Google Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  // ── Phone: send OTP ─────────────────────────────────────────────────────────
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!handlePhoneValidation()) return;
    setLoading(true);
    setValidationError("");
    setSuccessMessage("");
    try {
      // Normalize: strip spaces, ensure + prefix
      const normalized = "+" + phone.replace(/\D/g, "");
      const result = await sendPhoneOTP(normalized, recaptchaContainerId);
      confirmationRef.current = result;
      setPhoneStep(PHONE_STEP.ENTER_OTP);
      setSuccessMessage(
        isDemoMode
          ? "Demo mode: use OTP 123456"
          : "OTP sent! Check your messages.",
      );
    } catch (err) {
      setValidationError(err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  // ── Phone: verify OTP ───────────────────────────────────────────────────────
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setValidationError("");
    if (!otp || otp.length < 6) {
      setValidationError("Enter the 6-digit OTP.");
      return;
    }
    setLoading(true);
    try {
      await confirmPhoneOTP(
        confirmationRef.current,
        otp,
        phoneName || undefined,
      );
    } catch (err) {
      setValidationError(err.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Tab switch helper ───────────────────────────────────────────────────────
  const switchTab = (toLogin) => {
    setIsLoginTab(toLogin);
    setValidationError("");
    setSuccessMessage("");
    setPhoneStep(PHONE_STEP.ENTER_PHONE);
    confirmationRef.current = null;
  };

  const switchMode = (mode) => {
    setAuthMode(mode);
    setValidationError("");
    setSuccessMessage("");
    setPhoneStep(PHONE_STEP.ENTER_PHONE);
    confirmationRef.current = null;
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

      {/* Invisible reCAPTCHA container */}
      <div id={recaptchaContainerId} />

      {/* Brand Header */}
      <div className="flex flex-col items-center mb-8 text-center z-10">
        <div className="w-13 h-13 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 shadow-sm">
          <TrendingUp className="w-7 h-7 stroke-[2.2]" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          KharchaFlow
        </h1>
        <p className="text-sm text-zinc-400 font-medium mt-1.5">
          Track money effortlessly.
        </p>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl relative z-10">
        {/* ── Tab Switcher ── */}
        {!isForgotPassword && (
          <div className="flex bg-zinc-950 p-1.5 rounded-xl border border-zinc-800/60 mb-6">
            <button
              onClick={() => switchTab(true)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-150 ${
                isLoginTab
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => switchTab(false)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-150 ${
                !isLoginTab
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Register
            </button>
          </div>
        )}

        {/* ── Auth Mode Switcher (Email / Phone) – not shown in forgot-password ── */}
        {!isForgotPassword && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => switchMode(MODE.EMAIL)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border transition-all duration-150 ${
                authMode === MODE.EMAIL
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                  : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Mail className="w-3.5 h-3.5" /> Email
            </button>
            <button
              onClick={() => switchMode(MODE.PHONE)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border transition-all duration-150 ${
                authMode === MODE.PHONE
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                  : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Phone className="w-3.5 h-3.5" /> Phone
            </button>
          </div>
        )}

        {/* ── Title ── */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white tracking-tight">
            {isForgotPassword
              ? "Recover Password"
              : authMode === MODE.PHONE
                ? phoneStep === PHONE_STEP.ENTER_OTP
                  ? "Enter OTP"
                  : isLoginTab
                    ? "Sign in with Phone"
                    : "Register with Phone"
                : isLoginTab
                  ? "Sign in to account"
                  : "Create your account"}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {isForgotPassword
              ? "Enter your email to receive a password reset link."
              : authMode === MODE.PHONE
                ? phoneStep === PHONE_STEP.ENTER_OTP
                  ? `We've sent a 6-digit code to ${phone}.${isDemoMode ? " Demo OTP: 123456" : ""}`
                  : "Enter your phone number with country code to receive an OTP."
                : isLoginTab
                  ? "Enter your credentials below to access your finances."
                  : "Join thousands of users tracking money easily."}
          </p>
        </div>

        {/* ── Error / Success banners ── */}
        {(validationError || authError) && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-xl flex items-start gap-2.5 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-medium leading-normal">
              {validationError || authError}
            </span>
          </div>
        )}
        {successMessage && (
          <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex items-start gap-2.5 text-emerald-400 text-xs">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-medium leading-normal">{successMessage}</span>
          </div>
        )}

        {/* ══════════════ EMAIL AUTH FORM ══════════════ */}
        {(authMode === MODE.EMAIL || isForgotPassword) && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name – register only */}
            {!isLoginTab && !isForgotPassword && (
              <div>
                <label htmlFor="displayName" className="finance-label">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    id="displayName"
                    type="text"
                    placeholder="Your Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={loading}
                    className="finance-input pl-10"
                  />
                  <User className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-500" />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="finance-label">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="finance-input pl-10"
                />
                <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-500" />
              </div>
            </div>

            {/* Password */}
            {!isForgotPassword && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="password" className="finance-label mb-0">
                    Password
                  </label>
                  {isLoginTab && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setValidationError("");
                        setSuccessMessage("");
                      }}
                      className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="finance-input pl-10"
                  />
                  <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-500" />
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-[0.99] transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>
                    {isForgotPassword
                      ? "Send Reset Link"
                      : isLoginTab
                        ? "Sign In"
                        : "Create Account"}
                  </span>
                  <ArrowRight className="w-4 h-4 stroke-[2.2]" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ══════════════ PHONE AUTH FORM ══════════════ */}
        {authMode === MODE.PHONE && !isForgotPassword && (
          <>
            {/* Step 1 – enter phone */}
            {phoneStep === PHONE_STEP.ENTER_PHONE && (
              <form onSubmit={handleSendOTP} className="space-y-4">
                {/* Name – register only */}
                {!isLoginTab && (
                  <div>
                    <label htmlFor="phoneName" className="finance-label">
                      Full Name
                    </label>
                    <div className="relative">
                      <input
                        id="phoneName"
                        type="text"
                        placeholder="Your Name"
                        value={phoneName}
                        onChange={(e) => setPhoneName(e.target.value)}
                        disabled={loading}
                        className="finance-input pl-10"
                      />
                      <User className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-500" />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="phone" className="finance-label">
                    Phone Number
                  </label>
                  <div className="relative">
                    <input
                      id="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={loading}
                      className="finance-input pl-10"
                    />
                    <Phone className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-500" />
                  </div>
                  <p className="text-[10px] text-zinc-600 mt-1.5 ml-0.5">
                    Include country code e.g. +91 for India
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-[0.99] transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none mt-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Send OTP</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.2]" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Step 2 – enter OTP */}
            {phoneStep === PHONE_STEP.ENTER_OTP && (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label htmlFor="otp" className="finance-label">
                    6-Digit OTP
                  </label>
                  <div className="relative">
                    <input
                      id="otp"
                      type="number"
                      inputMode="numeric"
                      placeholder="123456"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                      disabled={loading}
                      className="finance-input pl-10 tracking-[0.4em] font-bold text-white text-center"
                    />
                    <ShieldCheck className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-500" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-[0.99] transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Verify &amp; Continue</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.2]" />
                    </>
                  )}
                </button>

                {/* Back to phone entry */}
                <button
                  type="button"
                  onClick={() => {
                    setPhoneStep(PHONE_STEP.ENTER_PHONE);
                    setOtp("");
                    setValidationError("");
                    setSuccessMessage("");
                    confirmationRef.current = null;
                  }}
                  className="w-full flex items-center justify-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Change phone number
                </button>
              </form>
            )}
          </>
        )}

        {/* Forgot Password back nav */}
        {isForgotPassword && (
          <button
            onClick={() => {
              setIsForgotPassword(false);
              setValidationError("");
              setSuccessMessage("");
            }}
            className="w-full text-center text-xs font-semibold text-zinc-400 hover:text-zinc-300 mt-5 transition-colors"
          >
            Back to Login
          </button>
        )}

        {/* ── Separator + Social buttons (not on forgot / phone OTP step) ── */}
        {!isForgotPassword &&
          !(authMode === MODE.PHONE && phoneStep === PHONE_STEP.ENTER_OTP) && (
            <>
              <div className="relative flex py-4 items-center mt-6">
                <div className="flex-grow border-t border-zinc-800/80" />
                <span className="flex-shrink mx-4 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  or continue with
                </span>
                <div className="flex-grow border-t border-zinc-800/80" />
              </div>

              {/* Google Sign-In — compact pill */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-zinc-950 hover:bg-zinc-800/60 text-zinc-200 border border-zinc-800 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 transition-all duration-150 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none mb-3"
              >
                <GoogleIcon size={16} />
                <span className="text-sm">Continue with Google</span>
              </button>

              {/* Continue without account button */}
              <button
                type="button"
                onClick={() => setShowNoAccountPopup(true)}
                disabled={loading}
                className="w-full bg-transparent hover:bg-zinc-800/40 text-zinc-400 hover:text-zinc-200 font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-150 text-xs border border-transparent hover:border-zinc-800"
              >
                Continue without account
              </button>
            </>
          )}
      </div>

      {/* ── No Account Warning Popup ── */}
      {showNoAccountPopup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative">
            {/* Close Button */}
            <button
              onClick={() => setShowNoAccountPopup(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="flex flex-col items-center text-center mt-2">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                <AlertCircle className="w-6 h-6 stroke-[2.2]" />
              </div>

              <h3 className="text-lg font-bold text-white tracking-tight">
                Continue without Account?
              </h3>
              <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
                Your transactions{" "}
                <span className="text-zinc-200 font-semibold">
                  will not be saved
                </span>{" "}
                to the cloud. You can still explore all features locally.
              </p>

              <div className="w-full mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowNoAccountPopup(false);
                    signInAsGuest();
                  }}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99] text-xs shadow-lg shadow-emerald-500/10"
                >
                  <span>Continue Offline</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.2]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trust signoff */}
      <span className="text-[10px] text-zinc-600 font-semibold tracking-wider uppercase mt-8 z-10">
        Secured with enterprise standard hashing
      </span>
    </div>
  );
}
