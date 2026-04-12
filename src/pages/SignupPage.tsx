import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { Eye, EyeOff, Clock, CheckCircle, ChevronDown } from "lucide-react";
import { sendEmailVerification } from "firebase/auth";

const COUNTRIES = [
  { code: "+91", label: "IND", flag: "🇮🇳" },
  { code: "+1", label: "USA", flag: "🇺🇸" },
  { code: "+44", label: "GBR", flag: "🇬🇧" },
  { code: "+971", label: "UAE", flag: "🇦🇪" },
  { code: "+1", label: "CAN", flag: "🇨🇦" },
  { code: "+61", label: "AUS", flag: "🇦🇺" },
  { code: "+65", label: "SGP", flag: "🇸🇬" },
  { code: "+49", label: "DEU", flag: "🇩🇪" },
];

export default function SignupPage() {
  const { registerUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Verification Modal State
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const [form, setForm] = useState({
    schoolName: "",
    role: "Principal",
    email: "",
    password: "",
    number: "",
    address: "",
    countryCode: "+91"
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    if (val.length <= 10) {
      setForm((prev) => ({ ...prev, number: val }));
    }
  };

  const handleStartRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.schoolName || !form.number) {
      setErrorMsg("Please complete all required institutional fields.");
      return;
    }

    if (form.number.length !== 10) {
      setErrorMsg("Secured phone line must be exactly 10 digits.");
      return;
    }
    
    setLoading(true);
    setErrorMsg("");

    try {
      // Step 1: Create Account in Firebase
      const authUser = await registerUser(form.email, form.password, form.role);
      
      // Step 2: Send Official Institutional Verification Link
      await sendEmailVerification(authUser);

      // Step 3: Cache Institutional Identity (Airlock Security)
      // We do NOT store this in the database yet to keep the Admin portal clean.
      // This data will be "born" into the DB only after verified login.
      const pendingData = {
        schoolName: form.schoolName,
        city: form.address,
        role: form.role,
        phone: `${form.countryCode}${form.number}`
      };
      localStorage.setItem(`pending_reg_${form.email}`, JSON.stringify(pendingData));

      // Step 4: Secure Logout (Wait for verification)
      await logout();
      
      // Step 5: Show Verification Sent UI
      setShowVerificationModal(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Institutional initialization failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`signup-wrapper ${isMounted ? 'fade-in' : ''}`}>
      <style>{styles}</style>
      
      <div className="bg-blur"></div>
      
      <div className="signup-card">
        {!showSuccess ? (
          <>
            <div className="signup-header">
              <div className="logo-icon">E</div>
              <h1>Initialize System</h1>
              <p>Register your institution for the EduSync Core.</p>
            </div>

            <form onSubmit={handleStartRegistration} className="signup-form">
              <div className="input-group">
                <label>Institutional Name</label>
                <input
                  placeholder="e.g. St. Xavier's Academy"
                  value={form.schoolName} required
                  readOnly onFocus={(e) => e.target.readOnly = false}
                  onChange={e => setForm({ ...form, schoolName: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Role</label>
                <input
                  placeholder="e.g. Principal"
                  value={form.role} required
                  readOnly onFocus={(e) => e.target.readOnly = false}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Authorized Email</label>
                <input
                  type="email"
                  placeholder="xyz@gmail.com"
                  value={form.email} required
                  autoComplete="new-email"
                  readOnly onFocus={(e) => e.target.readOnly = false}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password} required
                    autoComplete="new-password"
                    readOnly onFocus={(e) => e.target.readOnly = false}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label>Phone Number</label>
                <div className="phone-input-split">
                  <div className="country-selector-wrapper">
                    <select 
                      value={form.countryCode} 
                      onChange={(e) => setForm({...form, countryCode: e.target.value})}
                      className="country-select"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.label} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="selector-icon" />
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="10 Digits"
                    maxLength={10}
                    value={form.number} required
                    onChange={handlePhoneChange}
                    pattern="[0-9]{10}"
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Geo Location (City)</label>
                <input
                  placeholder="e.g. Muzaffarpur"
                  value={form.address}
                  readOnly onFocus={(e) => e.target.readOnly = false}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                />
              </div>

              {errorMsg && <p className="error-text">{errorMsg}</p>}
              
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? "Initializing Protocol..." : "Initialize Institutional Terminal"}
              </button>
            </form>

            <p className="footer-text">Already registered? <Link to="/login">Sign In</Link></p>
          </>
        ) : (
          <div className="success-view">
            <div className="success-icon">✓</div>
            <h1>Verification Active</h1>
            <p>Please check your email to finalize the institutional initialization.</p>
            <button onClick={() => navigate("/login")} className="submit-btn">Proceed to Login</button>
          </div>
        )}

        <Link to="/" className="back-link">&larr; Back to Home</Link>
      </div>

      {/* VERIFICATION PENDING MODAL */}
      {showVerificationModal && (
        <div className="otp-modal-overlay">
          <div className="otp-modal-card">
            <div className="otp-header">
              <div className="clock-container">
                <Clock className="pumping-clock" size={64} />
              </div>
              <h2>Verification Sent</h2>
              <p>An official institutional verification link has been dispatched to <strong>{form.email}</strong>.</p>
            </div>

            <div className="verification-info-area">
              <p className="sub-text">Please click the link in your email to activate your management access. Once verified, you can return here to sign in.</p>
            </div>

            <div className="otp-actions">
              <button onClick={() => navigate("/login")} className="submit-btn">
                Proceed to Login Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = `
.signup-wrapper {
  min-height: 100vh; background: #010208; display: flex; align-items: center; justify-content: center; padding: 60px 20px; position: relative; overflow-y: auto; font-family: 'Inter', sans-serif; opacity: 0; transition: opacity 0.8s;
}
.signup-wrapper.fade-in { opacity: 1; }

.bg-blur {
  position: absolute; top: 50%; left: 50%; width: 600px; height: 600px; background: radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%); transform: translate(-50%, -50%); filter: blur(80px); z-index: 0;
}

.signup-card {
  width: 100%; max-width: 440px; background: rgba(10, 10, 20, 0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 32px; padding: 3rem; position: relative; z-index: 10; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.signup-header { text-align: center; margin-bottom: 2.5rem; }
.logo-icon {
  width: 48px; height: 48px; background: #D4AF37; color: #000; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.5rem; margin: 0 auto 1.5rem;
}

.signup-header h1 { font-family: 'Sora', sans-serif; font-size: 2rem; font-weight: 800; color: #fff; margin-bottom: 0.5rem; letter-spacing: -0.02em; }
.signup-header p { color: #888; font-size: 1rem; }

.signup-form { display: flex; flex-direction: column; gap: 1.5rem; }
.input-group { display: flex; flex-direction: column; gap: 0.6rem; }
.input-group label { font-size: 0.85rem; font-weight: 600; color: #ccc; padding-left: 4px; }

.input-group input {
  padding: 1rem 1.2rem; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; color: #fff; font-size: 1rem; outline: none; transition: all 0.3s; width: 100%; box-sizing: border-box;
}

.phone-input-split {
  display: flex; gap: 0.5rem; align-items: stretch;
}

.country-selector-wrapper {
  position: relative; width: 110px; flex-shrink: 0;
}

.country-select {
  width: 100%; height: 100%; appearance: none; padding: 0 1rem; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; color: #fff; font-size: 0.95rem; cursor: pointer; outline: none; transition: all 0.3s;
}

.country-select:focus {
  border-color: #D4AF37; box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.1);
}

.selector-icon {
  position: absolute; right: 0.8rem; top: 50%; transform: translateY(-50%); color: #888; pointer-events: none;
}

.country-select option {
  background: #0a0a14; color: #fff;
}

.input-group input:focus {
  border-color: #D4AF37; background: rgba(255, 255, 255, 0.05); box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.1);
}

.password-input-wrapper { position: relative; width: 100%; }
.password-input-wrapper input { padding-right: 3.5rem; }

/* Remove browser-native reveal buttons (Edge, Chrome) */
.password-input-wrapper input::-ms-reveal,
.password-input-wrapper input::-ms-clear,
.password-input-wrapper input::-webkit-contacts-auto-fill-button,
.password-input-wrapper input::-webkit-credentials-auto-fill-button {
  display: none !important;
}

.password-toggle-btn {
  position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: #888; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: color 0.3s; padding: 0.5rem;
}
.password-toggle-btn:hover { color: #D4AF37; }

.submit-btn {
  padding: 1rem; background: #fff; color: #000; border: none; border-radius: 14px; font-size: 1.1rem; font-weight: 800; cursor: pointer; transition: all 0.2s; margin-top: 0.5rem; width: 100%;
}

.submit-btn:hover { opacity: 0.9; transform: translateY(-1px); }
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.error-text { color: #ff5555; font-size: 0.85rem; font-weight: 600; text-align: center; }

.footer-text { text-align: center; margin-top: 2rem; font-size: 0.9rem; color: #888; }
.footer-text a { color: #D4AF37; text-decoration: none; font-weight: 700; }

.back-link { display: block; text-align: center; margin-top: 2rem; font-size: 0.85rem; color: #555; text-decoration: none; font-weight: 600; transition: color 0.3s; }
.back-link:hover { color: #888; }

.success-view { text-align: center; padding: 2rem 0; }
.success-icon { width: 64px; height: 64px; background: rgba(52, 168, 83, 0.1); color: #34A853; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 1.5rem; border: 2px solid #34A853; }
.success-view h1 { font-family: 'Sora', sans-serif; font-size: 1.8rem; font-weight: 800; color: #fff; margin-bottom: 1rem; }
.success-view p { color: #888; font-size: 1rem; line-height: 1.6; margin-bottom: 2rem; }

/* VERIFICATION MODAL STYLES */
.otp-modal-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.otp-modal-card {
  width: 90%; max-width: 440px; background: #0a0a14; border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 24px; padding: 3rem; text-align: center; box-shadow: 0 0 50px rgba(212, 175, 55, 0.1);
}

.clock-container { margin-bottom: 2rem; }

.pumping-clock {
  color: #D4AF37;
  animation: pump 2s infinite ease-in-out;
}

@keyframes pump {
  0% { transform: scale(1); opacity: 0.7; filter: drop-shadow(0 0 5px rgba(212, 175, 55, 0.2)); }
  50% { transform: scale(1.15); opacity: 1; filter: drop-shadow(0 0 15px rgba(212, 175, 55, 0.5)); }
  100% { transform: scale(1); opacity: 0.7; filter: drop-shadow(0 0 5px rgba(212, 175, 55, 0.2)); }
}

.otp-header h2 { font-family: 'Sora', sans-serif; color: #fff; font-size: 1.6rem; margin-bottom: 0.8rem; }
.otp-header p { color: #888; font-size: 0.95rem; line-height: 1.5; margin-bottom: 2rem; }
.sub-text { color: #555; font-size: 0.9rem; line-height: 1.6; margin-bottom: 2.5rem; }

.otp-actions { margin-top: 1rem; display: flex; flex-direction: column; gap: 1rem; }
`;
