import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth as firebaseAuth } from "@/lib/firebase";
import api from "@/lib/api";
import { Eye, EyeOff } from "lucide-react";



export default function LoginPage() {
  const { login, logout, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passValue, setPassValue] = useState("");

  // Forgot Password States
  const [showForgot, setShowForgot] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetStatus, setResetStatus] = useState("");

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const fd = new FormData(event.currentTarget);
    const email = (fd.get("email") as string).trim().toLowerCase();
    const password = fd.get("password") as string;

    try {
      const authUser = await login(email, password);
      
      // IDENTITY GATE: Block unverified institutional accounts
      if (!authUser.user.emailVerified) {
        await logout();
        setErrorMsg("IDENTITY UNVERIFIED. PLEASE ACTIVATE VIA THE LINK SENT TO YOUR EMAIL.");
        setLoading(false);
        return;
      }

      try {
        const { data: profile } = await api.get('/api/auth/me');
        if (profile.role === 'admin') {
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/principal/dashboard", { replace: true });
        }
      } catch (profileErr: any) {
        // AUTO-BIRTH: If verified but no DB record exists, create it now
        const cached = localStorage.getItem(`pending_reg_${email}`);
        if (cached) {
          try {
            const data = JSON.parse(cached);
            await api.post('/api/registrations', {
              schoolName: data.schoolName,
              city: data.city,
              contactName: data.role,
              email: email,
              phone: data.phone,
              students: 0,
              plan: 'Standard',
              uid: authUser.user.uid
            });
            setErrorMsg("PROTOCOL INITIALIZED. PENDING ADMIN APPROVAL.");
            localStorage.removeItem(`pending_reg_${email}`);
          } catch (regErr) {
            setErrorMsg("SYSTEM INITIALIZATION FAILED. CONTACT SUPPORT.");
          }
        } else {
          setErrorMsg("NO INSTITUTIONAL PROFILE FOUND. PLEASE REGISTER.");
        }
        await logout();
        setLoading(false);
      }
    } catch (e: any) {
      setErrorMsg("INVALID CREDENTIALS. PLEASE TRY AGAIN.");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      await loginWithGoogle();
      try {
        const { data: profile } = await api.get('/api/auth/me');
        if (profile.role === 'admin') {
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/principal/dashboard", { replace: true });
        }
      } catch (profileErr: any) {
        await logout();
        setErrorMsg("NO ACCOUNT FOUND. PLEASE REGISTER.");
        setLoading(false);
      }
    } catch (e: any) {
      setErrorMsg("GOOGLE AUTHENTICATION FAILED.");
      setLoading(false);
    }
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const mail = (new FormData(e.target as HTMLFormElement).get('email') as string).trim();
    setLoading(true);
    setResetStatus("");
    try {
      await sendPasswordResetEmail(firebaseAuth, mail);
      setResetSent(true);
    } catch (err: any) {
      setResetStatus("Error: No account found or email failed to send.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <style>{styles}</style>

      <div className="bg-blur"></div>

      <div className="login-card">
        {!showForgot ? (
          <>
            <div className="login-header">
              <div className="logo-icon">E</div>
              <h1>Welcome Back</h1>
              <p>Sign in to your EduSync account</p>
            </div>

            <form onSubmit={handleSignIn} className="login-form">
              <div className="input-group">
                <label>Email Address</label>
                <input name="email" type="email" placeholder="e.g. xyz@gmail.com" required autoComplete="new-email" readOnly onFocus={(e) => e.target.readOnly = false} />
              </div>
              <div className="input-group">
                <label>Security Key</label>
                <div className="password-input-wrapper">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={passValue}
                    onChange={(e) => setPassValue(e.target.value)}
                    required
                    autoComplete="current-password"
                    readOnly onFocus={(e) => e.target.readOnly = false}
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
              {errorMsg && <p className="error-text">{errorMsg}</p>}
              <button type="submit" disabled={loading} className="submit-btn">{loading ? "Verifying..." : "Continue"}</button>
            </form>

            <div className="divider"><span>OR</span></div>

            <button type="button" onClick={handleGoogleSignIn} disabled={loading} className="google-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" /></svg>
              Sign in with Google
            </button>

            <button type="button" className="forgot-btn" onClick={() => setShowForgot(true)}>
              Forgot Password?
            </button>

            <p className="footer-text">New institution? <Link to="/signup">Initialize System</Link></p>
          </>
        ) : (
          <div className="reset-flow">
            <div className="login-header">
              <h1>Reset Access</h1>
              <p>{!resetSent ? 'Enter email to receive reset link' : 'Reset email sent!'}</p>
            </div>

            {!resetSent ? (
              <form onSubmit={handleResetRequest} className="login-form">
                <input name="email" type="email" placeholder="Enter Registration Email" required className="simple-input" />
                <button type="submit" disabled={loading} className="submit-btn">{loading ? 'Sending...' : 'Send Link'}</button>
                {resetStatus && <p className="error-text reset-err">{resetStatus}</p>}
                <button type="button" onClick={() => setShowForgot(false)} className="back-link-btn">← Back to Login</button>
              </form>
            ) : (
              <div className="success-view">
                <div className="success-icon">✓</div>
                <p>Check your email for the secure link to reset your password. Be sure to check your spam folder.</p>
                <button onClick={() => { setShowForgot(false); setResetSent(false); }} className="submit-btn">Return to Login</button>
              </div>
            )}
          </div>
        )}

        <Link to="/" className="back-link">&larr; Back to home</Link>
      </div>
    </div>
  );
}

const styles = `
.login-wrapper {
  min-height: 100vh; background: #010208; display: flex; align-items: center; justify-content: center; padding: 20px; position: relative; overflow: hidden; font-family: 'Inter', sans-serif;
}
.bg-blur {
  position: absolute; top: 50%; left: 50%; width: 600px; height: 600px; background: radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%); transform: translate(-50%, -50%); filter: blur(80px); z-index: 0;
}
.login-card {
  width: 100%; max-width: 440px; background: rgba(10, 10, 20, 0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 32px; padding: 3rem; position: relative; z-index: 10; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}
.login-header { text-align: center; margin-bottom: 2.5rem; }
.logo-icon { width: 48px; height: 48px; background: #D4AF37; color: #000; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.5rem; margin: 0 auto 1.5rem; }
.login-header h1 { font-family: 'Sora', sans-serif; font-size: 2rem; font-weight: 800; color: #fff; margin-bottom: 0.5rem; letter-spacing: -0.02em; }
.login-header p { color: #888; font-size: 1rem; }
.login-form { display: flex; flex-direction: column; gap: 1.5rem; }
.input-group { display: flex; flex-direction: column; gap: 0.6rem; }
.input-group label { font-size: 0.85rem; font-weight: 600; color: #ccc; padding-left: 4px; }
.input-group input, .simple-input { padding: 1rem 1.2rem; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; color: #fff; font-size: 1rem; outline: none; transition: all 0.3s; width: 100%; }
.input-group input:focus, .simple-input:focus { border-color: #D4AF37; background: rgba(255, 255, 255, 0.05); box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.1); }

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

.submit-btn { padding: 1rem; background: #fff; color: #000; border: none; border-radius: 14px; font-size: 1.1rem; font-weight: 800; cursor: pointer; transition: transform 0.2s, opacity 0.2s; margin-top: 0.5rem; }
.submit-btn:hover { opacity: 0.9; transform: translateY(-1px); }
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.error-text { color: #ff5555; font-size: 0.85rem; font-weight: 600; text-align: center; }
.reset-err { margin-top: 1rem; }
.divider { display: flex; align-items: center; text-align: center; margin: 2rem 0; color: #444; }
.divider::before, .divider::after { content: ''; flex: 1; border-bottom: 1px solid rgba(255, 255, 255, 0.08); }
.divider span { padding: 0 15px; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.1em; }
.google-btn { width: 100%; padding: 0.9rem; background: transparent; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; color: #fff; font-size: 1rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 12px; cursor: pointer; transition: background 0.3s; }
.google-btn:hover { background: rgba(255, 255, 255, 0.05); }
.forgot-btn { background: none; border: none; color: #888; font-weight: 600; font-size: 0.85rem; margin-top: 1.5rem; cursor: pointer; width: 100%; text-align: center; transition: color 0.3s; }
.forgot-btn:hover { color: #fff; }
.footer-text { text-align: center; margin-top: 2rem; font-size: 0.9rem; color: #888; }
.footer-text a { color: #D4AF37; text-decoration: none; font-weight: 700; }
.back-link, .back-link-btn { display: block; text-align: center; margin-top: 2rem; font-size: 0.85rem; color: #555; text-decoration: none; font-weight: 600; transition: color 0.3s; }
.back-link-btn { background: none; border: none; width: 100%; cursor: pointer; }
.back-link:hover, .back-link-btn:hover { color: #888; }
.success-view { text-align: center; padding: 2rem 0; }
.success-icon { width: 64px; height: 64px; background: rgba(52, 168, 83, 0.1); color: #34A853; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 1.5rem; border: 2px solid #34A853; }
`;
