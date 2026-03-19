import logo from '../assets/logo.gif';

export default function AuthLayout({ title, subtitle, children }) {
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

          <div className="auth-kicker">Secure campus reservations</div>
          <h1>Library-ready workflows with a cleaner, more reliable experience.</h1>
          <p>
            Access reservations, due dates, fines, and inventory updates from one connected workspace built
            for students, personnel, and library staff.
          </p>
        </div>

        <div className="auth-form">
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
          {children}
        </div>
      </div>
    </div>
  );
}
