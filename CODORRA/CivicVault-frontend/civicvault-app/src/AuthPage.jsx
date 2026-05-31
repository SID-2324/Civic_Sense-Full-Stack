import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";
const SESSION_KEY = "civicvault-session";

// ─── useAuth ──────────────────────────────────────────────────────────────────
// Custom hook that owns all authentication logic for CivicVault.

export function useAuth() {
  const navigate = useNavigate();

  // ── UI mode state ────────────────────────────────────────────────────────────
  const [mode, setMode] = useState("signin");         // "signin" | "signup"
  const [role, setRole] = useState("user");           // "user"   | "government"
  const [showPassword, setShowPassword] = useState(false);

  // ── Form field state ─────────────────────────────────────────────────────────
  const [formState, setFormState] = useState({
    name: "",
    governmentId: "",
    email: "",
    password: "",
    confirmPassword: "",
    rememberMe: true,
  });

  // ── Feedback state ───────────────────────────────────────────────────────────
  const [status, setStatus] = useState(null);         // { type, message } | null

  // ── Derived booleans ─────────────────────────────────────────────────────────
  const isSignIn = mode === "signin";
  const isUserRole = role === "user";

  // ── Field updater ─────────────────────────────────────────────────────────────
  const updateField = (field, value) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  // ── Validation ────────────────────────────────────────────────────────────────
  const validate = () => {
    if (!isSignIn && formState.password !== formState.confirmPassword) {
      setStatus({ type: "error", message: "Passwords do not match." });
      return false;
    }
    if (!formState.email.includes("@")) {
      setStatus({ type: "error", message: "Please enter a valid email address." });
      return false;
    }
    if (formState.password.length < 6) {
      setStatus({ type: "error", message: "Password must be at least 6 characters." });
      return false;
    }
    if (!isUserRole && !formState.governmentId.trim()) {
      setStatus({ type: "error", message: "Government ID is required." });
      return false;
    }
    return true;
  };

  // ── Submit handler ────────────────────────────────────────────────────────────
  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(null);

    if (!validate()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: mode,
          role,
          name: formState.name || formState.email.split("@")[0],
          email: formState.email,
          governmentId: formState.governmentId || null,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || payload?.message || "Unable to create session");
      }

      const session = payload.user;
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      setStatus({
        type: "success",
        message: isSignIn
          ? `Signing you in as ${session.role === "admin" ? "a government body" : "a citizen"}.`
          : `Creating a ${session.role === "admin" ? "government body" : "citizen"} account.`,
      });

      setTimeout(() => {
        navigate(session.role === "admin" ? "/gov" : "/vault");
      }, 600);
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Failed to create session." });
    }
  };

  // ── Google OAuth placeholder ──────────────────────────────────────────────────
  const handleGoogleSignIn = () => {
    setStatus({ type: "success", message: "Redirecting to Google..." });
  };

  return {
    mode, role, showPassword, formState, status,
    isSignIn, isUserRole,
    setMode, setRole, setShowPassword, updateField,
    handleSubmit, handleGoogleSignIn,
  };
}

// ─── AuthPage UI ──────────────────────────────────────────────────────────────
export default function AuthPage() {
  const {
    mode, role, showPassword, formState, status,
    isSignIn, isUserRole,
    setMode, setRole, setShowPassword, updateField,
    handleSubmit, handleGoogleSignIn,
  } = useAuth();

  const inputStyle = {
    width: "100%", padding: "12px 14px", borderRadius: "10px",
    border: "1.5px solid #e2e8f0", fontSize: "14px", fontFamily: "inherit",
    outline: "none", color: "#0f172a", boxSizing: "border-box",
    transition: "border-color 0.2s"
  };

  const labelStyle = {
    fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: 6, display: "block"
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#f8fafc", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Left side branding */}
      <div style={{ flex: 1, background: "#0f172a", display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px", color: "#fff", display: window.innerWidth < 768 ? "none" : "flex" }}>
        <div style={{ maxWidth: 400, margin: "0 auto" }}>
          <div style={{ fontSize: "40px", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 16 }}>CivicVault</div>
          <div style={{ fontSize: "18px", color: "#94a3b8", lineHeight: 1.6 }}>
            The unified platform for citizens to control their digital footprint, and for government bodies to securely request access.
          </div>
        </div>
      </div>

      {/* Right side form */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: "40px 20px" }}>
        <div style={{ width: "100%", maxWidth: 420, background: "#fff", padding: "40px", borderRadius: "24px", boxShadow: "0 10px 40px rgba(15,23,42,0.06)" }}>

          <div style={{ textAlign: "center", marginBottom: 30 }}>
            <div style={{ fontWeight: 800, fontSize: "24px", color: "#0f172a", marginBottom: 8 }}>
              {isSignIn ? "Welcome Back" : "Create an Account"}
            </div>
            <div style={{ fontSize: "14px", color: "#64748b" }}>
              {isSignIn ? "Sign in to access your dashboard" : "Sign up to get started"}
            </div>
          </div>

          {/* Role selector */}
          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "12px", padding: 4, marginBottom: 24 }}>
            <button
              type="button"
              onClick={() => setRole("user")}
              style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: isUserRole ? "#fff" : "transparent", color: isUserRole ? "#0f172a" : "#64748b", fontWeight: 700, fontSize: "13px", cursor: "pointer", fontFamily: "inherit", boxShadow: isUserRole ? "0 2px 8px rgba(0,0,0,0.05)" : "none", transition: "all 0.2s" }}
            >
              Citizen
            </button>
            <button
              type="button"
              onClick={() => setRole("government")}
              style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: !isUserRole ? "#fff" : "transparent", color: !isUserRole ? "#0f172a" : "#64748b", fontWeight: 700, fontSize: "13px", cursor: "pointer", fontFamily: "inherit", boxShadow: !isUserRole ? "0 2px 8px rgba(0,0,0,0.05)" : "none", transition: "all 0.2s" }}
            >
              Government Body
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {!isSignIn && (
              <div>
                <label style={labelStyle}>{isUserRole ? "Full Name" : "Department Name"}</label>
                <input type="text" placeholder={isUserRole ? "e.g. Arjun Mehta" : "e.g. Mumbai Municipal Corp"} style={inputStyle} value={formState.name} onChange={e => updateField("name", e.target.value)} required={!isSignIn} />
              </div>
            )}

            {!isUserRole && (
              <div>
                <label style={labelStyle}>Government ID Number</label>
                <input type="text" placeholder="e.g. GOV-MMC-001" style={inputStyle} value={formState.governmentId} onChange={e => updateField("governmentId", e.target.value)} required={!isUserRole} />
              </div>
            )}

            <div>
              <label style={labelStyle}>Email Address</label>
              <input type="email" placeholder="name@example.com" style={inputStyle} value={formState.email} onChange={e => updateField("email", e.target.value)} required />
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: "relative" }}>
                <input type={showPassword ? "text" : "password"} placeholder="••••••••" style={inputStyle} value={formState.password} onChange={e => updateField("password", e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "12px", fontWeight: 700 }}>
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            {!isSignIn && (
              <div>
                <label style={labelStyle}>Confirm Password</label>
                <input type={showPassword ? "text" : "password"} placeholder="••••••••" style={inputStyle} value={formState.confirmPassword} onChange={e => updateField("confirmPassword", e.target.value)} required={!isSignIn} />
              </div>
            )}

            {/* Status Message */}
            {status && (
              <div style={{ padding: "12px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, background: status.type === "error" ? "#fef2f2" : "#f0fdf4", color: status.type === "error" ? "#dc2626" : "#16a34a", border: `1px solid ${status.type === "error" ? "#fecaca" : "#bbf7d0"}` }}>
                {status.message}
              </div>
            )}

            <button type="submit" style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "none", background: "#0f172a", color: "#fff", fontWeight: 700, fontSize: "14px", cursor: "pointer", fontFamily: "inherit", marginTop: 8 }}>
              {isSignIn ? "Sign In" : "Create Account"}
            </button>
          </form>

          {isUserRole && (
            <div style={{ marginTop: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
                <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>OR</div>
                <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
              </div>
              <button onClick={handleGoogleSignIn} type="button" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid #e2e8f0", background: "#fff", color: "#0f172a", fontWeight: 700, fontSize: "13px", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                Sign in with Google
              </button>
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: 24, fontSize: "13px", color: "#64748b" }}>
            {isSignIn ? "Don't have an account?" : "Already have an account?"}
            <button type="button" onClick={() => { setMode(isSignIn ? "signup" : "signin"); setStatus(null); }} style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginLeft: 4 }}>
              {isSignIn ? "Sign Up" : "Sign In"}
            </button>
          </div>

        </div>
      </div>
      <style>{`
        input:focus { border-color: #0f172a !important; }
      `}</style>
    </div>
  );
}
