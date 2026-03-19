import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import logo from '../assets/logo.gif';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const data = await login(id, pw);
      if (data.mustChangePassword) {
        navigate('/change-password');
      } else if (['developer', 'librarian'].includes(data.user?.role)) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  const showPopup = () => {
    alert(
      'UniReserve accounts are created by the library administration.\n\nIf you are a student or personnel of Saint Michael College of Caraga, please visit your designated library so a librarian can create your account.'
    );
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="logo-area">
            <div className="logo-mark image">
              <img src={logo} alt="SMCC logo" className="logo-img" />
            </div>
            <div className="logo-text">
              <div className="brand">UniReserve</div>
              <div className="sub">Saint Michael College of Caraga</div>
            </div>
          </div>

          <div className="auth-kicker">Smart reservation operations</div>
          <h1>Plan requests, manage borrowing, and stay ahead of due dates.</h1>
          <p>
            UniReserve brings together the catalog, approval workflow, fines, and activity alerts in one
            practical campus system that staff and borrowers can rely on every day.
          </p>

          <div className="chip-row" style={{ marginTop: '22px' }}>
            <span className="chip">Faster approvals</span>
            <span className="chip">Live availability</span>
            <span className="chip">Clear accountability</span>
          </div>
        </div>

        <div className="auth-form">
          <h2>Welcome back</h2>
          <p>Sign in with your school or employee ID to continue.</p>

          <form onSubmit={submit} className="list-stack">
            <div>
              <div className="text-sm text-gray-700 mb-2">School ID / Employee ID</div>
              <input
                className="input"
                placeholder="Enter your ID"
                value={id}
                onChange={(e) => setId(e.target.value)}
              />
            </div>

            <div>
              <div className="text-sm text-gray-700 mb-2">Password</div>
              <input
                type="password"
                className="input"
                placeholder="Enter your password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
              />
            </div>

            {error ? <p className="text-red-600 text-sm">{error}</p> : null}

            <div className="action-row">
              <button type="submit" className="btn-primary">Sign in</button>
              <button type="button" onClick={showPopup} className="btn-ghost">Account help</button>
            </div>
          </form>

          <div className="surface-muted" style={{ marginTop: '22px' }}>
            <div className="font-semibold text-sm">Need access?</div>
            <div className="inline-note" style={{ marginTop: '6px' }}>
              UniReserve accounts are issued by the library administration. Visit your designated library if
              you need a new account or password support.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
